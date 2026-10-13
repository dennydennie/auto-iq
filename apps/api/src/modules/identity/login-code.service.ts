import { HttpException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { UserEntity } from "../../db/entity/user.entity";
import { UserRepository } from "../../db/repository/user.repository";
import { NotificationProvider } from "../notifications/notification-provider";
import { RedisService } from "../redis/redis.service";
import { RateLimitService } from "./rate-limit.service";
import { RequestLoginCodeDto, VerifyLoginCodeDto } from "./dto/login-code.dto";

const META = { expiresIn: 300, resendAfter: 30 };

@Injectable()
export class LoginCodeService {
  constructor(private readonly config: ConfigService, private readonly users: UserRepository,
    private readonly redis: RedisService, private readonly limits: RateLimitService,
    private readonly provider: NotificationProvider) {}

  async request(dto: RequestLoginCodeDto) {
    const identifier = dto.identifier.trim();
    const key = this.identifierKey(identifier);
    await this.limits.consume(`${key}:send`, 3, 900);
    if (!await this.redis.setIfAbsent(`${key}:cooldown`, "1", 30)) throw new HttpException({ code: "OTP_RESEND_TOO_SOON", message: "Wait 30 seconds before requesting another code." }, 429);
    const user = await this.users.findByIdentifier(identifier);
    if (!allowed(user)) return META;
    await this.limits.consume(`login-otp:user-send:${this.tenant()}:${user.id}`, 3, 900);
    await this.redis.del(this.attemptKey(user.id));
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redis.set(this.codeKey(user.id), this.hash(code), META.expiresIn);
    await this.deliver(user, code, dto.channels);
    return META;
  }

  private async deliver(user: UserEntity, code: string, channels: RequestLoginCodeDto["channels"]) {
    const results = await Promise.allSettled(channels.map(channel => this.provider.send({
      channel, recipientAddress: channel === "SMS" ? user.phone : user.email,
      template: "OTP_VERIFY", payload: { code, expiresIn: META.expiresIn },
    })));
    if (results.some(value => value.status === "fulfilled")) return;
    await this.redis.takeIfEqual(this.codeKey(user.id), this.hash(code));
    throw new ServiceUnavailableException({ code: "DELIVERY_UNAVAILABLE", message: "We could not send the code. Try again shortly." });
  }

  async verify(dto: VerifyLoginCodeDto) {
    const user = await this.users.findByIdentifier(dto.identifier.trim());
    if (!allowed(user)) throw invalidCode();
    const remaining = await this.verificationBudget(user.id);
    const saved = await this.redis.get(this.codeKey(user.id));
    if (!matches(saved, this.hash(dto.code))) {
      if (remaining === 0) { await this.redis.del(this.codeKey(user.id)); throw attemptsExhausted(); }
      throw invalidCode();
    }
    if (!await this.redis.takeIfEqual(this.codeKey(user.id), this.hash(dto.code))) throw invalidCode();
    await this.redis.del(this.attemptKey(user.id));
    return { userId: user.id, email: user.email, role: user.roles[0]?.role ?? "BUYER", status: user.status };
  }

  private async verificationBudget(id: string) {
    try { return await this.limits.consume(`login-otp:verify:${this.tenant()}:${id}`, 5, META.expiresIn); }
    catch (error) {
      if (!(error instanceof HttpException) || error.getStatus() !== 429) throw error;
      await this.redis.del(this.codeKey(id));
      throw attemptsExhausted();
    }
  }
  private attemptKey(id: string) { return `rate:login-otp:verify:${this.tenant()}:${id}`; }

  private identifierKey(value: string) {
    return `login-otp:${this.tenant()}:${createHash("sha256").update(value.toLowerCase()).digest("hex")}`;
  }
  private codeKey(id: string) { return `login-otp:${this.tenant()}:code:${id}`; }
  private tenant() { return this.config.getOrThrow<string>("DEFAULT_TENANT_ID"); }
  private hash(code: string) { return createHmac("sha256", this.config.getOrThrow<string>("SESSION_SECRET")).update(code).digest("hex"); }
}

function allowed(user: UserEntity | null): user is UserEntity {
  return !!user && user.status === "ACTIVE" && !!user.roles?.length && !user.roles.some(value => value.role === "ADMIN");
}
function matches(actual: string | null, expected: string) {
  return !!actual && actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
function invalidCode() { return new UnauthorizedException({ code: "OTP_INVALID", message: "That code is invalid or expired. Request a new code." }); }

function attemptsExhausted() { return new UnauthorizedException({ code: "OTP_MAX_ATTEMPTS", message: "Too many attempts. Request a new code." }); }
