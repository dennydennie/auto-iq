import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomInt } from "node:crypto";
import { UserRepository } from "../../db/repository/user.repository";
import { NotificationService } from "../notifications/notification.service";
import { RedisService } from "../redis/redis.service";
import { RateLimitService } from "./rate-limit.service";

const OTP_TTL_SECONDS = 300;
const OTP_SEND_LIMIT = 3;

@Injectable()
export class OtpService {
  constructor(
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: RateLimitService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
  ) {}

  async send(phone: string) {
    const attemptsRemaining = await this.rateLimitService.consume(
      `otp:${phone}`,
      OTP_SEND_LIMIT,
      60 * 15,
    );
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redisService.set(this.key(phone), this.hash(code), OTP_TTL_SECONDS);
    if (this.config.get<string>("NODE_ENV") !== "production") {
      await this.redisService.set(this.deliveryKey(phone), code, OTP_TTL_SECONDS);
    }
    const user = await this.userRepository.findByPhone(phone);
    if (user) {
      await this.notificationService.notifyUser({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        template: "OTP_VERIFY",
        idempotencyKeyBase: `otp:${phone}:${code}`,
        payload: { phone, expiresIn: OTP_TTL_SECONDS },
        channels: ["SMS"],
      });
    }
    return { expiresIn: OTP_TTL_SECONDS, attemptsRemaining };
  }

  async verify(phone: string, code: string) {
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Phone not found" });
    }

    const stored = await this.redisService.get(this.key(phone));
    if (!stored) {
      throw new UnauthorizedException({ code: "OTP_EXPIRED", message: "OTP expired" });
    }
    if (stored !== this.hash(code)) {
      throw new UnauthorizedException({ code: "OTP_INVALID", message: "Invalid OTP" });
    }
    user.phoneVerified = true;
    user.status = "ACTIVE";
    await this.userRepository.save(user);
    await this.redisService.del(this.key(phone));
    await this.redisService.del(this.deliveryKey(phone));
    return { verified: true, userId: user.id };
  }

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  private deliveryKey(phone: string): string {
    return `otp_delivery:${phone}`;
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
