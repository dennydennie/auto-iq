import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomInt } from "node:crypto";
import { UserRepository } from "../../db/repository/user.repository";
import { NotificationService } from "../notifications/notification.service";
import { RedisService } from "../redis/redis.service";
import { RateLimitService } from "./rate-limit.service";

const OTP_TTL_SECONDS = 300;
const OTP_SEND_LIMIT = 3;
const OTP_VERIFY_LIMIT = 5;

@Injectable()
export class OtpService {
  constructor(
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: RateLimitService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
  ) {}

  async send(identifier: string) {
    const value = identifier.trim();
    const attemptsRemaining = await this.rateLimitService.consume(
      `otp:${value.toLowerCase()}`,
      OTP_SEND_LIMIT,
      60 * 15,
    );
    const user = await this.userRepository.findByIdentifier(value);
    if (!user || user.status !== "PENDING_VERIFICATION") {
      return { expiresIn: OTP_TTL_SECONDS, attemptsRemaining };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redisService.del(this.attemptsKey(user.phone));
    await this.redisService.set(
      this.key(user.phone),
      this.hash(code),
      OTP_TTL_SECONDS,
    );
    if (this.config.get<string>("NODE_ENV") !== "production") {
      await this.redisService.set(
        this.deliveryKey(user.phone),
        code,
        OTP_TTL_SECONDS,
      );
    }

    const deliveries = await this.notificationService.notifyUser({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      template: "OTP_VERIFY",
      idempotencyKeyBase: `otp:${user.phone}:${code}`,
      payload: { code, expiresIn: OTP_TTL_SECONDS, phone: user.phone },
      channels: ["SMS", "EMAIL"],
    });

    if (!deliveries.some((delivery) => delivery.status === "SENT")) {
      await this.redisService.del(this.key(user.phone));
      await this.redisService.del(this.deliveryKey(user.phone));
      throw new ServiceUnavailableException({
        code: "DELIVERY_UNAVAILABLE",
        message:
          "Unable to deliver a verification code right now. Please try again shortly.",
      });
    }
    return { expiresIn: OTP_TTL_SECONDS, attemptsRemaining };
  }

  async verify(identifier: string, code: string) {
    const user = await this.userRepository.findByIdentifier(identifier.trim());
    if (!user || user.status !== "PENDING_VERIFICATION") {
      throw this.invalidOtp();
    }

    const stored = await this.redisService.get(this.key(user.phone));
    if (!stored) {
      throw this.invalidOtp();
    }
    if (stored !== this.hash(code)) {
      await this.rejectInvalidCode(user.phone);
    }
    user.phoneVerified = true;
    user.status = "ACTIVE";
    await this.userRepository.save(user);
    await this.redisService.del(this.key(user.phone));
    await this.redisService.del(this.deliveryKey(user.phone));
    await this.redisService.del(this.attemptsKey(user.phone));
    return { userId: user.id };
  }

  private async rejectInvalidCode(phone: string): Promise<never> {
    const attempts = await this.redisService.increment(
      this.attemptsKey(phone),
      OTP_TTL_SECONDS,
    );
    if (attempts < OTP_VERIFY_LIMIT) {
      throw this.invalidOtp();
    }
    await this.redisService.del(this.key(phone));
    await this.redisService.del(this.deliveryKey(phone));
    throw new UnauthorizedException({
      code: "OTP_MAX_ATTEMPTS",
      message: "Too many attempts. Request a new code.",
    });
  }

  private invalidOtp() {
    return new UnauthorizedException({
      code: "OTP_INVALID",
      message: "Invalid OTP",
    });
  }

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  private deliveryKey(phone: string): string {
    return `otp_delivery:${phone}`;
  }

  private attemptsKey(phone: string): string {
    return `otp_attempts:${phone}`;
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
