import { webcrypto } from "node:crypto";
import { PasskeyService } from "./passkey.service";
import { PasskeyChallengeService } from "./passkey-challenge.service";
import { PasskeySettingsService } from "./passkey-settings.service";
import { VirtualAuthenticator } from "./testing/virtual-authenticator";
import { PasskeyCredentialEntity } from "../../db/entity/passkey-credential.entity";
import { Reflector } from "@nestjs/core";
import { PasskeyController } from "./passkey.controller";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";

Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
const userId = "11111111-1111-4111-8111-111111111112";
const actor = { id: userId, email: "buyer@example.test", roles: ["BUYER"], sessionId: "test-session" };

function fixture() {
  const values = new Map<string, string>();
  const credentials: PasskeyCredentialEntity[] = [];
  const user = { id: userId, email: actor.email, fullName: "Test buyer", status: "ACTIVE", roles: [{ role: "BUYER" }] };
  const config = { get: () => "", getOrThrow: (key: string) => key === "WEB_BASE_URL" ? "https://bisellautoiq.co.zw" : "tenant-test" };
  const redis = { set: async (key: string, value: string) => { values.set(key, value); },
    get: async (key: string) => key.startsWith("recent_auth:") ? user.id : values.get(key) ?? null,
    take: async (key: string) => { const value = values.get(key) ?? null; values.delete(key); return value; } };
  const store = { list: async () => credentials, save: async (id: string, data: object) => {
    const saved = Object.assign(new PasskeyCredentialEntity(), data, { id: "credential-row", userId: id }); credentials.push(saved); return saved;
  }, find: async (id: string, key: string) => credentials.find(value => value.userId === id && value.credentialId === key && !value.revokedAt) ?? null,
    advance: async () => true, remove: async () => ({ removed: true }) };
  const service = new PasskeyService({ findProfileById: async () => user } as never, store as never,
    new PasskeyChallengeService(redis as never, config as never), new PasskeySettingsService(config as never),
    redis as never, { sign: (value: string) => value } as never);
  return { service, user, redis, credentials, values };
}

async function enrol(service: PasskeyService, authenticator = new VirtualAuthenticator()) {
  const offered = await service.registrationOptions(actor);
  await service.register(actor, { challengeId: offered.challengeId, response: authenticator.create(offered.options) });
  return authenticator;
}
async function answer(service: PasskeyService, authenticator: VirtualAuthenticator) {
  const offered = await service.loginOptions();
  return { challengeId: offered.challengeId, response: authenticator.get(offered.options) };
}

describe("Passkeys with real cryptographic assertions", () => {
  it("registers a public key and authenticates its owner without an OTP", async () => {
    const { service, credentials } = fixture();
    const authenticator = await enrol(service);
    expect((await service.list(actor)).data[0]).not.toHaveProperty("publicKey");
    expect(credentials[0].publicKey).toBeInstanceOf(Buffer);
    expect(await service.login(await answer(service, authenticator))).toMatchObject({ userId });
  });
  it("rejects replayed and expired challenges", async () => {
    const { service, values } = fixture(); const authenticator = await enrol(service);
    const dto = await answer(service, authenticator); await service.login(dto);
    await expect(service.login(dto)).rejects.toMatchObject({ response: { code: "PASSKEY_CHALLENGE_EXPIRED" } });
    const expired = await answer(service, authenticator); values.clear();
    await expect(service.login(expired)).rejects.toThrow();
  });
  it("rejects a signature made without the registered private key", async () => {
    const { service } = fixture(); const authenticator = await enrol(service);
    const offered = await service.loginOptions();
    await expect(service.login({ challengeId: offered.challengeId, response: authenticator.forge(offered.options) })).rejects.toThrow();
  });
  it("rejects a valid signature from a different origin", async () => {
    const { service } = fixture(); const authenticator = await enrol(service);
    authenticator.origin = "https://another-app.example.test";
    await expect(service.login(await answer(service, authenticator))).rejects.toThrow();
  });
  it("rejects missing user verification with an otherwise valid signature", async () => {
    const { service } = fixture(); const authenticator = await enrol(service); authenticator.verified = false;
    await expect(service.login(await answer(service, authenticator))).rejects.toThrow();
  });
  it("rejects a signature for a different challenge or RP", async () => {
    const { service } = fixture(); const authenticator = await enrol(service);
    const one = await service.loginOptions(); const two = await service.loginOptions();
    await expect(service.login({ challengeId: two.challengeId, response: authenticator.get(one.options) })).rejects.toThrow();
    const three = await service.loginOptions();
    await expect(service.login({ challengeId: three.challengeId, response: authenticator.get({ ...three.options, rpId: "another-app.example.test" }) })).rejects.toThrow();
  });
  it("rejects a credential paired with another account handle", async () => {
    const { service } = fixture(); const authenticator = await enrol(service);
    const dto = await answer(service, authenticator);
    dto.response.response.userHandle = Buffer.from("22222222-2222-4222-8222-222222222222").toString("base64url");
    await expect(service.login(dto)).rejects.toThrow();
  });
  it("rejects suspended, revoked and admin accounts", async () => {
    const { service, user, credentials } = fixture(); const authenticator = await enrol(service);
    user.status = "SUSPENDED"; await expect(service.login(await answer(service, authenticator))).rejects.toThrow();
    user.status = "ACTIVE"; credentials[0].revokedAt = new Date();
    await expect(service.login(await answer(service, authenticator))).rejects.toThrow();
    user.roles = [{ role: "ADMIN" }]; await expect(service.registrationOptions(actor)).rejects.toThrow();
  });
  it("binds registration to the account and recently authenticated session", async () => {
    const { service, redis } = fixture();
    const options = await service.registrationOptions(actor);
    await expect(service.register({ ...actor, sessionId: "different-session" }, {
      challengeId: options.challengeId, response: new VirtualAuthenticator().create(options.options),
    })).rejects.toThrow();
    redis.get = async () => null;
    await expect(service.registrationOptions(actor)).rejects.toMatchObject({ response: { code: "PASSKEY_REAUTHENTICATION_REQUIRED" } });
  });
  it("requires authentication and CSRF protection for every credential mutation", () => {
    const reflector = new Reflector();
    for (const method of ["registrationOptions", "register", "remove"] as const) {
      expect(reflector.get("__guards__", PasskeyController.prototype[method])).toEqual([AuthGuard, CsrfGuard]);
    }
  });
});
