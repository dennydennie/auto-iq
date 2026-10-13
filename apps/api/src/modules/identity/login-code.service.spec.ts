import { HttpException } from "@nestjs/common";
import { LoginCodeService } from "./login-code.service";

function fixture() {
  const values = new Map<string, string>();
  const user = { id: "buyer-test", email: "buyer@example.test", phone: "+263771234567", status: "ACTIVE", roles: [{ role: "BUYER" }] };
  const provider = { send: jest.fn().mockResolvedValue({ providerRef: "test-only:accepted" }) };
  const redis = { get: async (key: string) => values.get(key) ?? null,
    set: async (key: string, value: string) => { values.set(key, value); },
    setIfAbsent: jest.fn().mockResolvedValue(true), del: async (key: string) => { values.delete(key); },
    takeIfEqual: async (key: string, expected: string) => { if (values.get(key) !== expected) return false; values.delete(key); return true; } };
  const limits = { consume: jest.fn().mockResolvedValue(2) };
  const service = new LoginCodeService({ getOrThrow: (key: string) => key === "SESSION_SECRET" ? "test-only-hmac-secret" : "tenant-test" } as never,
    { findByIdentifier: async () => user } as never, redis as never, limits as never, provider as never);
  return { service, provider, values, redis, limits, user };
}
async function sentCode(value: ReturnType<typeof fixture>, channels: Array<"SMS" | "EMAIL"> = ["SMS"]) {
  await value.service.request({ identifier: value.user.phone, channels });
  return value.provider.send.mock.calls[0][0].payload.code as string;
}

describe("Code login", () => {
  it("uses only the requested delivery channel and signs in with a single-use code", async () => {
    const value = fixture(); const code = await sentCode(value);
    expect(value.provider.send).toHaveBeenCalledTimes(1);
    expect(value.provider.send.mock.calls[0][0]).toMatchObject({ channel: "SMS", recipientAddress: value.user.phone });
    expect([...value.values.values()]).not.toContain(code);
    expect(await value.service.verify({ identifier: value.user.phone, code })).toMatchObject({ userId: value.user.id });
    await expect(value.service.verify({ identifier: value.user.phone, code })).rejects.toThrow();
  });
  it("delivers email codes to the registered inbox", async () => {
    const value = fixture(); await sentCode(value, ["EMAIL"]);
    expect(value.provider.send.mock.calls[0][0]).toMatchObject({ channel: "EMAIL", recipientAddress: value.user.email });
  });
  it("rejects delivery failures without leaving a usable code", async () => {
    const value = fixture(); value.provider.send.mockRejectedValue(new Error("delivery unavailable"));
    await expect(sentCode(value)).rejects.toMatchObject({ response: { code: "DELIVERY_UNAVAILABLE" } });
    expect([...value.values.keys()].some(key => key.includes(":code:"))).toBe(false);
  });
  it("enforces resend cooldown and bounded verification attempts", async () => {
    const value = fixture(); value.redis.setIfAbsent.mockResolvedValue(false);
    await expect(value.service.request({ identifier: value.user.phone, channels: ["SMS"] })).rejects.toMatchObject({ status: 429 });
    expect(value.provider.send).not.toHaveBeenCalled();
    value.redis.setIfAbsent.mockResolvedValue(true); const code = await sentCode(value);
    value.limits.consume.mockRejectedValue(new Error("rate limited"));
    await expect(value.service.verify({ identifier: value.user.phone, code })).rejects.toThrow("rate limited");
  });
  it("locks verification and invalidates the code when attempts are exhausted", async () => {
    const value = fixture(); const code = await sentCode(value);
    value.limits.consume.mockRejectedValue(new HttpException("rate limited", 429));
    await expect(value.service.verify({ identifier: value.user.phone, code })).rejects.toMatchObject({ response: { code: "OTP_MAX_ATTEMPTS" } });
    expect([...value.values.keys()].some(key => key.includes(":code:"))).toBe(false);
  });
  it("preserves a newer code issued during verification of an older code", async () => {
    const value = fixture(); const code = await sentCode(value);
    value.redis.takeIfEqual = async key => { value.values.set(key, "newer-code-hash"); return false; };
    await expect(value.service.verify({ identifier: value.user.phone, code })).rejects.toThrow();
    expect([...value.values.values()]).toContain("newer-code-hash");
  });
  it("does not deliver or authenticate suspended or admin accounts", async () => {
    for (const state of ["SUSPENDED", "ADMIN"]) {
      const value = fixture();
      if (state === "ADMIN") value.user.roles = [{ role: "ADMIN" }]; else value.user.status = state;
      await value.service.request({ identifier: value.user.phone, channels: ["SMS"] });
      expect(value.provider.send).not.toHaveBeenCalled();
      await expect(value.service.verify({ identifier: value.user.phone, code: "123456" })).rejects.toThrow();
    }
  });
});
