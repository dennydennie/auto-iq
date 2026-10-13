import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type RegistrationResponseJSON, type AuthenticatorTransport } from "@simplewebauthn/server";
import type { AuthenticatedUser } from "../../common/types/http";
import { UserRepository } from "../../db/repository/user.repository";
import { PasskeyCredentialEntity } from "../../db/entity/passkey-credential.entity";
import { RedisService } from "../redis/redis.service";
import { VerifyPasskeyDto } from "./dto/passkey.dto";
import { PasskeyChallengeService } from "./passkey-challenge.service";
import { PasskeySettingsService } from "./passkey-settings.service";
import { PasskeyStoreService, publicPasskey } from "./passkey-store.service";
import { SessionService } from "./session.service";

@Injectable()
export class PasskeyService {
  constructor(private readonly users: UserRepository, private readonly store: PasskeyStoreService,
    private readonly challenges: PasskeyChallengeService, private readonly settings: PasskeySettingsService,
    private readonly redis: RedisService, private readonly sessions: SessionService) {}

  config() { return { enabled: true, android: this.settings.origins().some(value => value.startsWith("android:")) }; }

  async registrationOptions(actor: AuthenticatedUser) {
    const user = await this.requireRecentUser(actor);
    const existing = await this.store.list(user.id);
    if (existing.length >= 10) throw new BadRequestException({ code: "PASSKEY_LIMIT_REACHED", message: "Remove a passkey before adding another." });
    const options = await generateRegistrationOptions({
      rpID: this.settings.rpId(), rpName: "BiSell AutoIQ", attestationType: "none", supportedAlgorithmIDs: [-7, -257],
      userID: new TextEncoder().encode(user.id), userName: user.email, userDisplayName: user.fullName,
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      excludeCredentials: existing.map(value => ({ id: value.credentialId, transports: value.transports })),
    });
    const challengeId = await this.challenges.issue("registration", options.challenge, this.binding(actor));
    return { challengeId, options };
  }

  async register(actor: AuthenticatedUser, dto: VerifyPasskeyDto) {
    await this.requireRecentUser(actor);
    const expectedChallenge = await this.challenges.consume("registration", dto.challengeId, this.binding(actor));
    const verified = await verifyRegistrationResponse({
      response: dto.response as unknown as RegistrationResponseJSON, expectedChallenge,
      expectedOrigin: this.settings.origins(), expectedRPID: this.settings.rpId(), requireUserVerification: true, supportedAlgorithmIDs: [-7, -257],
    }).catch(() => null);
    if (!verified?.verified) throw rejected();
    return this.persistRegistration(actor.id, dto, verified.registrationInfo);
  }

  private async persistRegistration(userId: string, dto: VerifyPasskeyDto,
    info: NonNullable<Awaited<ReturnType<typeof verifyRegistrationResponse>>["registrationInfo"]>) {
    try {
      const credential = info.credential;
      return publicPasskey(await this.store.save(userId, {
        credentialId: credential.id, publicKey: Buffer.from(credential.publicKey),
        counter: String(credential.counter), transports: validTransports(credential.transports ?? []),
        backedUp: info.credentialBackedUp, label: dto.label?.trim() || null,
      }));
    } catch (error) {
      if ((error as { code?: string }).code !== "23505") throw error;
      throw new ConflictException({ code: "PASSKEY_ALREADY_REGISTERED", message: "This passkey is already registered." });
    }
  }

  async loginOptions() {
    const options = await generateAuthenticationOptions({ rpID: this.settings.rpId(), userVerification: "required" });
    return { challengeId: await this.challenges.issue("authentication", options.challenge), options };
  }

  async login(dto: VerifyPasskeyDto) {
    const expectedChallenge = await this.challenges.consume("authentication", dto.challengeId);
    const response = dto.response as unknown as AuthenticationResponseJSON;
    const userId = ownerFromResponse(response);
    const credential = await this.store.find(userId, response.id);
    if (!credential) throw rejected();
    const user = await this.requireUser(userId);
    const verified = await this.verifyLogin(response, expectedChallenge, credential);
    if (!verified?.verified) throw rejected();
    const info = verified.authenticationInfo;
    if (!await this.store.advance(credential, info.newCounter, info.credentialBackedUp)) throw rejected();
    return { userId: user.id, email: user.email, role: user.roles[0]?.role ?? "BUYER", status: user.status };
  }

  private verifyLogin(response: AuthenticationResponseJSON, expectedChallenge: string, value: PasskeyCredentialEntity) {
    return verifyAuthenticationResponse({ response, expectedChallenge,
      expectedOrigin: this.settings.origins(), expectedRPID: this.settings.rpId(), requireUserVerification: true,
      credential: { id: value.credentialId, publicKey: new Uint8Array(value.publicKey),
        counter: Number(value.counter), transports: value.transports },
    }).catch(() => null);
  }

  async list(actor: AuthenticatedUser) {
    await this.requireUser(actor.id);
    return { data: (await this.store.list(actor.id)).map(publicPasskey) };
  }

  async remove(actor: AuthenticatedUser, id: string) {
    await this.requireRecentUser(actor);
    return this.store.remove(actor.id, id);
  }

  private async requireUser(id: string) {
    const user = await this.users.findProfileById(id);
    if (!user || user.status !== "ACTIVE" || !user.roles.length || user.roles.some(value => value.role === "ADMIN")) throw rejected();
    return user;
  }

  private async requireRecentUser(actor: AuthenticatedUser) {
    const user = await this.requireUser(actor.id);
    const recent = await this.redis.get(`recent_auth:${this.sessions.sign(actor.sessionId)}`);
    if (recent !== user.id) throw new UnauthorizedException({
      code: "PASSKEY_REAUTHENTICATION_REQUIRED", message: "Sign in again before changing your passkeys.",
    });
    return user;
  }

  private binding(actor: AuthenticatedUser) { return `${actor.id}:${this.sessions.sign(actor.sessionId)}`; }
}

export function ownerFromResponse(response: AuthenticationResponseJSON) {
  if (typeof response.id !== "string" || !/^[A-Za-z0-9_-]{1,2048}$/.test(response.id)) throw rejected();
  const handle = response.response?.userHandle;
  const id = typeof handle === "string" && handle.length <= 128 ? Buffer.from(handle, "base64url").toString("utf8") : "";
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) throw rejected();
  return id;
}

function rejected() {
  return new UnauthorizedException({ code: "PASSKEY_NOT_RECOGNISED", message: "That passkey could not be used. Sign in another way." });
}

function validTransports(values: string[]): AuthenticatorTransport[] {
  const accepted: AuthenticatorTransport[] = ["ble", "hybrid", "internal", "nfc", "usb"];
  return values.filter((value): value is AuthenticatorTransport => accepted.some(item => item === value));
}
