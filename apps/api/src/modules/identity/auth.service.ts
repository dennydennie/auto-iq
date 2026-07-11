import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { AuditLogEntity } from "../../db/entity/audit-log.entity";
import { BuyerProfileEntity } from "../../db/entity/buyer-profile.entity";
import { SellerProfileEntity } from "../../db/entity/seller-profile.entity";
import { UserRoleEntity } from "../../db/entity/user-role.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { AuditLogRepository } from "../../db/repository/audit-log.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { RedisService } from "../redis/redis.service";
import { NotificationService } from "../notifications/notification.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import { PasswordService } from "./password.service";
import { RateLimitService } from "./rate-limit.service";
import { createHash, randomBytes } from "node:crypto";

const RESET_TTL_SECONDS = 60 * 30;
const DEFAULT_WEB_BASE_URL = "https://web-staging-1017.up.railway.app";
const LOGIN_RATE_WINDOW_SECONDS = 60 * 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly rateLimitService: RateLimitService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async register(body: RegisterDto) {
    const email = body.email.toLowerCase();
    await this.assertUnique(email, body.phone);
    const passwordHash = await this.passwordService.hash(body.password);

    const user = await this.dataSource.transaction(async (manager) => {
      const savedUser = await manager.save(UserEntity, {
        fullName: body.fullName,
        email,
        phone: body.phone,
        passwordHash,
        city: body.city,
        status: "PENDING_VERIFICATION",
      });
      await manager.save(UserRoleEntity, {
        userId: savedUser.id,
        role: body.role,
      });
      if (body.role === "BUYER") {
        await manager.save(BuyerProfileEntity, {
          userId: savedUser.id,
          city: body.city,
        });
      } else {
        await manager.save(SellerProfileEntity, {
          userId: savedUser.id,
          city: body.city,
        });
      }
      await manager.save(AuditLogEntity, {
        actorUserId: savedUser.id,
        action: "auth.register",
        entityType: "user",
        entityId: savedUser.id,
        outcome: "success",
      });
      return savedUser;
    });

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: body.role,
      otpRequired: true,
    };
  }

  async login(body: LoginDto, clientIp: string) {
    await this.consumeLoginLimits(body.identifier, clientIp);
    const user = await this.userRepository.findByIdentifier(body.identifier);
    const valid = user
      ? await this.passwordService.verify(body.password, user.passwordHash)
      : false;
    if (!user || !valid || user.status === "SUSPENDED") {
      await this.audit("auth.login", user?.id ?? null, "failure");
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    if (user.status !== "ACTIVE") {
      await this.audit("auth.login", user.id, "failure");
      throw new UnauthorizedException({
        code: "OTP_REQUIRED",
        message: "Verify your phone number before signing in.",
        details: [
          {
            field: "phone",
            message: "Registered phone number",
            value: maskPhone(user.phone),
          },
        ],
      });
    }
    await this.audit("auth.login", user.id, "success");
    return {
      userId: user.id,
      email: user.email,
      role: user.roles[0]?.role ?? "BUYER",
      status: user.status,
    };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    await this.rateLimitService.consume(
      `forgot:${body.email.toLowerCase()}`,
      3,
      60 * 15,
    );
    const user = await this.userRepository.findByEmail(body.email);
    if (!user) {
      return;
    }

    const token = randomBytes(32).toString("base64url");
    await this.redisService.set(`reset:${token}`, user.id, RESET_TTL_SECONDS);

    const resetUrl = this.resetUrl(token);
    const deliveries = await this.notificationService.notifyUser({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      template: "PASSWORD_RESET",
      idempotencyKeyBase: `password-reset:${user.id}:${token}`,
      payload: {
        email: user.email,
        expiresInMinutes: Math.round(RESET_TTL_SECONDS / 60),
        resetUrl,
      },
      channels: ["EMAIL"],
    });

    if (this.config.get<string>("NODE_ENV") !== "production") {
      await this.redisService.set(
        `reset_delivery:${user.email}`,
        token,
        RESET_TTL_SECONDS,
      );
    }

    if (!deliveries.some((delivery) => delivery.status === "SENT")) {
      await this.redisService.del(`reset:${token}`);
      await this.redisService.del(`reset_delivery:${user.email}`);
      throw new ServiceUnavailableException({
        code: "DELIVERY_UNAVAILABLE",
        message:
          "Password reset is temporarily unavailable. Please try again shortly.",
      });
    }

    await this.audit("auth.password_reset_requested", user.id, "success");
  }

  async resetPassword(body: ResetPasswordDto) {
    const userId = await this.redisService.get(`reset:${body.token}`);
    if (!userId) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid reset token",
      });
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid reset token",
      });
    }
    user.passwordHash = await this.passwordService.hash(body.newPassword);
    await this.userRepository.save(user);
    await this.redisService.del(`reset:${body.token}`);
    await this.redisService.del(`reset_delivery:${user.email}`);
    await this.audit("auth.password_reset_completed", user.id, "success");
  }

  private async assertUnique(email: string, phone: string) {
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Email already registered",
      });
    }
    const existingPhone = await this.userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Phone already registered",
      });
    }
  }

  private async consumeLoginLimits(identifier: string, clientIp: string) {
    const normalized = identifier.trim().toLowerCase();
    await this.rateLimitService.consume(
      `login-client:${hashKey(`${normalized}:${clientIp}`)}`,
      5,
      LOGIN_RATE_WINDOW_SECONDS,
    );
    await this.rateLimitService.consume(
      `login-account:${hashKey(normalized)}`,
      25,
      LOGIN_RATE_WINDOW_SECONDS,
    );
  }

  private async audit(
    action: string,
    actorUserId: string | null,
    outcome: string,
  ) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        action,
        actorUserId,
        entityType: "user",
        entityId: actorUserId,
        outcome,
      }),
    );
  }

  private resetUrl(token: string) {
    const baseUrl =
      this.config.get<string>("WEB_BASE_URL") ??
      this.config
        .get<string>("CORS_ORIGINS", DEFAULT_WEB_BASE_URL)
        .split(",")[0]
        ?.trim() ??
      DEFAULT_WEB_BASE_URL;
    const url = new URL("/auth/reset-password", baseUrl);
    url.hash = `token=${encodeURIComponent(token)}`;
    return url.toString();
  }
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function maskPhone(phone: string) {
  const prefixLength = Math.max(1, Math.min(4, phone.length - 4));
  return `${phone.slice(0, prefixLength)}••••${phone.slice(-4)}`;
}
