import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationProvider, type ProviderSendInput, type ProviderSendResult } from "./notification-provider";

type NotificationMessage = {
  subject?: string;
  text: string;
  html?: string;
};

const DEFAULT_SENDGRID_API_BASE_URL = "https://api.sendgrid.com";
const DEFAULT_GIKKO_API_BASE_URL = "https://api.infobip.com";
const DEFAULT_PROVIDER_TIMEOUT_MS = 10_000;

@Injectable()
export class ConfigurableNotificationProvider extends NotificationProvider {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    if (input.channel === "EMAIL") {
      return this.sendEmail(input);
    }

    if (input.channel === "SMS") {
      return this.sendSms(input);
    }

    throw new Error(`Notification channel ${input.channel} is not supported`);
  }

  private async sendEmail(input: ProviderSendInput) {
    const provider = this.emailProvider();

    if (provider === "sandbox") {
      return this.sandboxOrThrow(input.channel, "email");
    }

    if (provider === "resend") {
      return this.sendResendEmail(input);
    }

    if (provider === "sendgrid") {
      return this.sendSendGridEmail(input);
    }

    throw new Error(`Unsupported email provider: ${provider}`);
  }

  private async sendSms(input: ProviderSendInput) {
    const provider = this.smsProvider();

    if (provider === "sandbox") {
      return this.sandboxOrThrow(input.channel, "sms");
    }

    if (provider === "twilio") {
      return this.sendTwilioSms(input);
    }

    if (provider === "gikko") {
      return this.sendGikkoSms(input);
    }

    if (provider === "stub") {
      return this.sendStubSms(input);
    }

    throw new Error(`Unsupported sms provider: ${provider}`);
  }

  private async sendResendEmail(input: ProviderSendInput) {
    const apiKey = this.requireString(["RESEND_API_KEY"], "RESEND_API_KEY");
    const from = this.requireString(
      ["NOTIFICATION_EMAIL_FROM", "SENDGRID_SENDER_EMAIL", "EMAIL_SENDER_EMAIL"],
      "NOTIFICATION_EMAIL_FROM",
    );
    const replyTo = this.optionalString("NOTIFICATION_EMAIL_REPLY_TO");
    const message = renderNotificationMessage(input);
    const response = await this.fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.recipientAddress],
          subject: message.subject ?? "Auto IQ notification",
          text: message.text,
          html: message.html,
          reply_to: replyTo || undefined,
        }),
      },
      DEFAULT_PROVIDER_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw new Error(`Resend email delivery failed with status ${response.status}`);
    }

    const payload = (await this.readResponseBody(response)) as { id?: string };
    return {
      providerRef: payload.id ? `resend:${payload.id}` : `resend:${Date.now()}`,
    };
  }

  private async sendSendGridEmail(input: ProviderSendInput) {
    const message = renderNotificationMessage(input);
    const response = await this.fetchWithTimeout(
      `${this.apiBaseUrl("SENDGRID_API_BASE_URL", DEFAULT_SENDGRID_API_BASE_URL)}/v3/mail/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.requireString(["SENDGRID_API_KEY"], "SENDGRID_API_KEY")}`,
          "Content-Type": "application/json",
          "User-Agent": "AutoIQ-API",
        },
        body: JSON.stringify({
          content: [
            { type: "text/plain", value: message.text },
            { type: "text/html", value: message.html ?? wrapTextHtml(message.text) },
          ],
          from: { email: this.requireString(
            ["SENDGRID_SENDER_EMAIL", "EMAIL_SENDER_EMAIL", "NOTIFICATION_EMAIL_FROM"],
            "SENDGRID_SENDER_EMAIL",
          ) },
          personalizations: [{ to: [{ email: input.recipientAddress }] }],
          subject: message.subject ?? "Auto IQ notification",
        }),
      },
      DEFAULT_PROVIDER_TIMEOUT_MS,
    );
    const payload = await this.readResponseBody(response);

    if (!response.ok) {
      throw new Error(
        `SendGrid email delivery failed with status ${response.status}${responseErrorSuffix(payload)}`,
      );
    }

    const messageId = response.headers.get("x-message-id") ?? readMessageId(payload);
    return {
      providerRef: messageId ? `sendgrid:${messageId}` : `sendgrid:${Date.now()}`,
    };
  }

  private async sendTwilioSms(input: ProviderSendInput) {
    const accountSid = this.requireString(["TWILIO_ACCOUNT_SID"], "TWILIO_ACCOUNT_SID");
    const authToken = this.requireString(["TWILIO_AUTH_TOKEN"], "TWILIO_AUTH_TOKEN");
    const from = this.requireString(["TWILIO_FROM_PHONE"], "TWILIO_FROM_PHONE");
    const message = renderNotificationMessage(input);
    const body = new URLSearchParams({
      To: input.recipientAddress,
      From: from,
      Body: message.text,
    });
    const response = await this.fetchWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
      DEFAULT_PROVIDER_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw new Error(`Twilio SMS delivery failed with status ${response.status}`);
    }

    const payload = (await this.readResponseBody(response)) as { sid?: string };
    return {
      providerRef: payload.sid ? `twilio:${payload.sid}` : `twilio:${Date.now()}`,
    };
  }

  private async sendGikkoSms(input: ProviderSendInput) {
    const message = renderNotificationMessage(input);
    const notifyUrl = this.optionalString("GIKKO_SMS_NOTIFY_URL") ?? this.optionalString("GIKKO_DELIVERY_REPORT_URL");
    const response = await this.fetchWithTimeout(
      this.gikkoSendUrl(),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${this.optionalString("GIKKO_SMS_AUTH_SCHEME") ?? "App"} ${this.requireString(["GIKKO_SMS_API_KEY", "GIKKO_API_KEY"], "GIKKO_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{
            callbackData: JSON.stringify({ template: input.template }),
            destinations: [{ to: normalisePhone(input.recipientAddress) }],
            from: this.requireString(["GIKKO_SMS_SENDER", "GIKKO_SENDER_NAME"], "GIKKO_SENDER_NAME"),
            notifyContentType: "application/json",
            notifyUrl: notifyUrl || undefined,
            text: message.text,
          }],
        }),
      },
      this.positiveNumber("GIKKO_SMS_TIMEOUT_MS", DEFAULT_PROVIDER_TIMEOUT_MS),
    );
    const payload = await this.readResponseBody(response);

    if (!response.ok) {
      throw new Error(`Gikko SMS delivery failed with status ${response.status}${responseErrorSuffix(payload)}`);
    }

    const firstMessage = readFirstMessage(payload);
    const messageId = firstMessage ? readStringField(firstMessage, "messageId") ?? readStringField(firstMessage, "id") : null;
    return {
      providerRef: messageId ? `gikko:${messageId}` : `gikko:${Date.now()}`,
    };
  }

  private sendStubSms(input: ProviderSendInput) {
    return Promise.resolve({
      providerRef: `stub:${input.channel.toLowerCase()}:${Date.now()}`,
    });
  }

  private sandboxOrThrow(channel: ProviderSendInput["channel"], label: string) {
    if (!isProductionLike(this.configService.get<string>("NODE_ENV"))) {
      return Promise.resolve({
        providerRef: `sandbox:${channel.toLowerCase()}:${Date.now()}`,
      });
    }

    throw new Error(`No ${label} notification provider is configured`);
  }

  private emailProvider() {
    const explicit = this.optionalString("NOTIFICATION_EMAIL_PROVIDER");
    if (explicit) {
      return explicit;
    }
    if (this.optionalString("RESEND_API_KEY")) {
      return "resend";
    }
    if (this.optionalString("SENDGRID_API_KEY")) {
      return "sendgrid";
    }
    return "sandbox";
  }

  private smsProvider() {
    const explicit = this.optionalString("NOTIFICATION_SMS_PROVIDER");
    if (explicit) {
      return explicit;
    }
    if (this.optionalString("TWILIO_ACCOUNT_SID") || this.optionalString("TWILIO_AUTH_TOKEN")) {
      return "twilio";
    }
    if (this.gikkoEnabled() && (this.optionalString("GIKKO_SMS_API_KEY") || this.optionalString("GIKKO_API_KEY"))) {
      return "gikko";
    }
    return "sandbox";
  }

  private gikkoEnabled() {
    const enabled = this.configService.get<string | boolean>("GIKKO_SMS_ENABLED");
    return enabled !== false && enabled !== "false";
  }

  private gikkoSendUrl() {
    const explicit = this.optionalString("GIKKO_SMS_SEND_URL");
    if (explicit) {
      return explicit;
    }
    const baseUrl = this.apiBaseUrl("GIKKO_BASE_URL", DEFAULT_GIKKO_API_BASE_URL);
    return `${baseUrl}/sms/2/text/advanced`;
  }

  private optionalString(key: string) {
    const value = this.configService.get<string | boolean | number>(key);
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private requireString(keys: string[], label: string) {
    for (const key of keys) {
      const value = this.optionalString(key);
      if (value) {
        return value;
      }
    }

    throw new Error(`${label} is required for notification delivery`);
  }

  private positiveNumber(key: string, fallback: number) {
    const value = this.configService.get<string | number>(key);
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return fallback;
  }

  private apiBaseUrl(key: string, fallback: string) {
    const value = this.optionalString(key) ?? fallback;
    return value.replace(/\/$/, "");
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readResponseBody(response: Response) {
    const text = await response.text();
    if (text.trim().length === 0) {
      return {};
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text };
    }
  }
}

function renderNotificationMessage(input: ProviderSendInput): NotificationMessage {
  if (input.template === "OTP_VERIFY") {
    const code = readString(input.payload.code, "OTP code");
    const expiresInSeconds = readNumber(input.payload.expiresIn, 300);
    const text =
      `Your Auto IQ verification code is ${code}. ` +
      `It expires in ${Math.max(1, Math.round(expiresInSeconds / 60))} minutes.`;

    return {
      subject: "Your Auto IQ verification code",
      text,
      html: wrapTextHtml(text),
    };
  }

  if (input.template === "PASSWORD_RESET") {
    const resetUrl = readString(input.payload.resetUrl, "Password reset URL");
    const expiresInMinutes = readNumber(input.payload.expiresInMinutes, 30);
    const text =
      "We received a request to reset your Auto IQ password.\n\n" +
      `Open this link to continue: ${resetUrl}\n\n` +
      `This link expires in ${expiresInMinutes} minutes.`;

    return {
      subject: "Reset your Auto IQ password",
      text,
      html:
        '<div style="font-family: Arial, sans-serif; line-height: 1.5;">' +
        "<p>We received a request to reset your Auto IQ password.</p>" +
        `<p><a href="${escapeHtml(resetUrl)}">Open the secure reset link</a></p>` +
        `<p>This link expires in ${expiresInMinutes} minutes.</p>` +
        "</div>",
    };
  }

  const label = titleCase(input.template.replace(/_/g, " ").toLowerCase());
  const text =
    `Auto IQ notification: ${label}\n\n` +
    formatPayload(input.payload);

  return {
    subject: `Auto IQ ${label}`,
    text,
    html: wrapTextHtml(text),
  };
}

function formatPayload(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .map(([key, value]) => `${titleCase(key.replace(/([A-Z])/g, " $1"))}: ${stringifyValue(value)}`)
    .join("\n");
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function wrapTextHtml(content: string) {
  return `<div style="font-family: Arial, sans-serif; line-height: 1.5;">${escapeHtml(content).replace(/\n/g, "<br/>")}</div>`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function readString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required for notification delivery`);
  }

  return value.trim();
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
}

function isProductionLike(nodeEnv: string | undefined) {
  return nodeEnv === "staging" || nodeEnv === "production";
}

function readFirstMessage(body: unknown) {
  if (!isRecord(body)) {
    return null;
  }
  if (!Array.isArray(body.messages)) {
    return body;
  }
  const [message] = body.messages;
  return isRecord(message) ? message : null;
}

function readMessageId(body: unknown) {
  return readStringField(readFirstMessage(body), "messageId")
    ?? readStringField(readFirstMessage(body), "id");
}

function readStringField(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function responseErrorSuffix(body: unknown) {
  const detail = firstErrorMessage(body) ?? readStringField(isRecord(body) ? body : null, "message") ?? readStringField(isRecord(body) ? body : null, "error");
  return detail ? `: ${detail}` : "";
}

function firstErrorMessage(body: unknown) {
  if (!isRecord(body) || !Array.isArray(body.errors)) {
    return null;
  }

  for (const error of body.errors) {
    if (!isRecord(error)) {
      continue;
    }
    const message = error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
  }

  return null;
}

function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("263")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+263${digits.slice(1)}`;
  }

  return value.startsWith("+") ? value : `+${digits}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
