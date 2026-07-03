import { Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
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

  async send(identifier: string) {
    const value = identifier.trim();
    const attemptsRemaining = await this.rateLimitService.consume(
      `otp:${value.toLowerCase()}`,
      OTP_SEND_LIMIT,
      60 * 15,
    );
    const user = await this.userRepository.findByIdentifier(value);
    if (!user) {
      return { expiresIn: OTP_TTL_SECONDS, attemptsRemaining };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redisService.set(this.key(user.phone), this.hash(code), OTP_TTL_SECONDS);
    if (this.config.get<string>("NODE_ENV") !== "production") {
      await this.redisService.set(this.deliveryKey(user.phone), code, OTP_TTL_SECONDS);
    }
    const channels = this.otpChannels(user);
    const deliveries = await this.notificationService.notifyUser({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      template: "OTP_VERIFY",
      idempotencyKeyBase: `otp:${user.phone}:${code}`,
      payload: { code, expiresIn: OTP_TTL_SECONDS, phone: user.phone },
      channels,
    });

    const sentChannels = new Set(
      deliveries
        .filter((delivery) => delivery.status === "SENT")
        .map((delivery) => delivery.channel),
    );
    if (!channels.every((channel) => sentChannels.has(channel))) {
      await this.redisService.del(this.key(user.phone));
      await this.redisService.del(this.deliveryKey(user.phone));
      throw new ServiceUnavailableException({
        code: "DELIVERY_UNAVAILABLE",
        message: "Unable to deliver a verification code right now. Please try again shortly.",
      });
    }
    return { expiresIn: OTP_TTL_SECONDS, attemptsRemaining };
  }

  async verify(identifier: string, code: string) {
    const user = await this.userRepository.findByIdentifier(identifier.trim());
    if (!user) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Account not found" });
    }

    const stored = await this.redisService.get(this.key(user.phone));
    if (!stored) {
      throw new UnauthorizedException({ code: "OTP_EXPIRED", message: "OTP expired" });
    }
    if (stored !== this.hash(code)) {
      throw new UnauthorizedException({ code: "OTP_INVALID", message: "Invalid OTP" });
    }
    user.phoneVerified = true;
    user.status = "ACTIVE";
    await this.userRepository.save(user);
    await this.redisService.del(this.key(user.phone));
    await this.redisService.del(this.deliveryKey(user.phone));
    return { verified: true, userId: user.id };
  }

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  private deliveryKey(phone: string): string {
    return `otp_delivery:${phone}`;
  }

  private otpChannels(user: { email?: string | null; phone?: string | null }) {
    return [
      ...(user.phone ? ["SMS" as const] : []),
      ...(user.email ? ["EMAIL" as const] : []),
    ];
  }

  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }
}
