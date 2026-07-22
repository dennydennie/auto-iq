import { ConfigurableNotificationProvider } from "./configurable-notification.provider";

describe("ConfigurableNotificationProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("auto-detects SendGrid email delivery from Blue-style configuration", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 202,
        headers: { "x-message-id": "sendgrid-message-1" },
      }),
    );
    const provider = createProvider({
      NODE_ENV: "staging",
      SENDGRID_API_KEY: "sendgrid-key",
      SENDGRID_SENDER_EMAIL: "no-reply@autoiq.example",
    });

    const result = await provider.send({
      channel: "EMAIL",
      recipientAddress: "buyer@example.com",
      template: "OTP_VERIFY",
      payload: { code: "123456", expiresIn: 300 },
    });

    expect(result).toEqual({ providerRef: "sendgrid:sendgrid-message-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sendgrid-key",
          "Content-Type": "application/json",
          "User-Agent": "AutoIQ-API",
        }),
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      content: expect.arrayContaining([
        expect.objectContaining({ type: "text/plain" }),
        expect.objectContaining({ type: "text/html" }),
      ]),
      from: { email: "no-reply@autoiq.example" },
      personalizations: [{ to: [{ email: "buyer@example.com" }] }],
      subject: "Your Auto IQ verification code",
    });
  });

  it("renders password reset emails with a visible HTTPS reset link", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 202,
        headers: { "x-message-id": "sendgrid-message-2" },
      }),
    );
    const resetUrl = "https://web.example.com/auth/reset-password#token=abc123";
    const provider = createProvider({
      NODE_ENV: "staging",
      SENDGRID_API_KEY: "sendgrid-key",
      SENDGRID_SENDER_EMAIL: "no-reply@autoiq.example",
    });

    await provider.send({
      channel: "EMAIL",
      recipientAddress: "buyer@example.com",
      template: "PASSWORD_RESET",
      payload: { resetUrl, expiresInMinutes: 30 },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const html = body.content.find(
      (part: { type: string }) => part.type === "text/html",
    )?.value;
    const text = body.content.find(
      (part: { type: string }) => part.type === "text/plain",
    )?.value;

    expect(text).toContain(resetUrl);
    expect(html).toContain(`href="${resetUrl}"`);
    expect(html).toContain(`>${resetUrl}</a>`);
  });

  it("renders mobile password reset emails with the numeric code", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 202,
        headers: { "x-message-id": "sendgrid-message-3" },
      }),
    );
    const provider = createProvider({
      NODE_ENV: "staging",
      SENDGRID_API_KEY: "sendgrid-key",
      SENDGRID_SENDER_EMAIL: "no-reply@autoiq.example",
    });

    await provider.send({
      channel: "EMAIL",
      recipientAddress: "buyer@example.com",
      template: "PASSWORD_RESET_CODE",
      payload: { resetCode: "123456", expiresInMinutes: 30 },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const html = body.content.find(
      (part: { type: string }) => part.type === "text/html",
    )?.value;
    const text = body.content.find(
      (part: { type: string }) => part.type === "text/plain",
    )?.value;

    expect(body.subject).toBe("Reset your Auto IQ password");
    expect(text).toContain("123456");
    expect(text).not.toContain("http");
    expect(html).toContain("<strong>123456</strong>");
    expect(html).not.toContain("href=");
  });

  it("auto-detects Gikko SMS delivery from Blue-style configuration", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          messages: [
            {
              messageId: "gikko-message-1",
              status: { name: "ACCEPTED" },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = createProvider({
      NODE_ENV: "staging",
      GIKKO_API_KEY: "gikko-key",
      GIKKO_BASE_URL: "https://api.infobip.com",
      GIKKO_SENDER_NAME: "AutoIQ",
    });

    const result = await provider.send({
      channel: "SMS",
      recipientAddress: "0771234567",
      template: "OTP_VERIFY",
      payload: { code: "123456", expiresIn: 300 },
    });

    expect(result).toEqual({ providerRef: "gikko:gikko-message-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.infobip.com/sms/2/text/advanced",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "App gikko-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      messages: [
        expect.objectContaining({
          destinations: [{ to: "+263771234567" }],
          from: "AutoIQ",
          text: expect.stringContaining("123456"),
        }),
      ],
    });
  });

  it("supports explicit stub SMS delivery for staging without vendor credentials", async () => {
    const provider = createProvider({
      NODE_ENV: "production",
      NOTIFICATION_SMS_PROVIDER: "stub",
    });

    const result = await provider.send({
      channel: "SMS",
      recipientAddress: "+263771234567",
      template: "OTP_VERIFY",
      payload: { code: "123456", expiresIn: 300 },
    });

    expect(result.providerRef).toMatch(/^stub:sms:/);
  });
});

function createProvider(values: Record<string, unknown>) {
  const configService = {
    get: jest.fn((key: string) => values[key]),
  };

  return new ConfigurableNotificationProvider(configService as never);
}
