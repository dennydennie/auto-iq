import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { TenantContext } from "../../common/tenancy/tenant-context";
import { AuditLogEntity } from "../../db/entity/audit-log.entity";
import { BuyerProfileEntity } from "../../db/entity/buyer-profile.entity";
import { SellerProfileEntity } from "../../db/entity/seller-profile.entity";
import { UserRoleEntity } from "../../db/entity/user-role.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { TenantMembershipEntity } from "../../db/entity/tenant-membership.entity";
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
import { createHash, randomBytes, randomInt } from "node:crypto";

const RESET_TTL_SECONDS = 60 * 30;
const RESET_CODE_VERIFY_LIMIT = 5;
const DEFAULT_WEB_BASE_URL = "http://localhost:3000";
const LOGIN_RATE_WINDOW_SECONDS = 60 * 15;
const DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";

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
      const tenantId = this.config.get<string>("DEFAULT_TENANT_ID", DEFAULT_TENANT_ID);
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
      await TenantContext.run({ tenantId, userId: savedUser.id }, () =>
        manager.save(TenantMembershipEntity, {
          tenantId,
          userId: savedUser.id,
          role: body.role,
          active: true,
        }),
      );
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

    if (body.client === "MOBILE") {
      await this.sendResetCode(user);
    } else {
      await this.sendResetLink(user);
    }

    await this.audit("auth.password_reset_requested", user.id, "success");
  }

  async resetPassword(body: ResetPasswordDto) {
    if (body.token) {
      await this.resetPasswordWithToken(body.token, body.newPassword);
      return;
    }
    if (body.email && body.code) {
      await this.resetPasswordWithCode(body.email, body.code, body.newPassword);
      return;
    }
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: "Provide a reset token or email and code.",
    });
  }

  private async resetPasswordWithToken(token: string, newPassword: string) {
    const userId = await this.redisService.get(`reset:${token}`);
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
    user.passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.save(user);
    await this.redisService.del(`reset:${token}`);
    await this.redisService.del(`reset_delivery:${user.email}`);
    await this.audit("auth.password_reset_completed", user.id, "success");
  }

  private async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) throw this.invalidResetCode();
    const stored = await this.redisService.get(this.resetCodeKey(user.id));
    if (!stored) throw this.invalidResetCode();
    if (stored !== hashKey(code)) {
      await this.rejectInvalidResetCode(user);
    }
    user.passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.save(user);
    await this.clearResetCode(user);
    await this.audit("auth.password_reset_completed", user.id, "success");
  }

  private async sendResetLink(user: Pick<UserEntity, "id" | "email" | "phone">) {
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
      throw this.resetDeliveryUnavailable();
    }
  }

  private async sendResetCode(user: Pick<UserEntity, "id" | "email" | "phone">) {
    const resetCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redisService.del(this.resetAttemptsKey(user.id));
    await this.redisService.set(
      this.resetCodeKey(user.id),
      hashKey(resetCode),
      RESET_TTL_SECONDS,
    );

    if (this.config.get<string>("NODE_ENV") !== "production") {
      await this.redisService.set(
        this.resetCodeDeliveryKey(user.email),
        resetCode,
        RESET_TTL_SECONDS,
      );
    }

    const deliveries = await this.notificationService.notifyUser({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      template: "PASSWORD_RESET_CODE",
      idempotencyKeyBase: `password-reset-code:${user.id}:${hashKey(resetCode)}`,
      payload: {
        email: user.email,
        expiresInMinutes: Math.round(RESET_TTL_SECONDS / 60),
        resetCode,
      },
      channels: ["EMAIL"],
    });

    if (!deliveries.some((delivery) => delivery.status === "SENT")) {
      await this.clearResetCode(user);
      throw this.resetDeliveryUnavailable();
    }
  }

  private async rejectInvalidResetCode(
    user: Pick<UserEntity, "id" | "email">,
  ): Promise<never> {
    const attempts = await this.redisService.increment(
      this.resetAttemptsKey(user.id),
      RESET_TTL_SECONDS,
    );
    if (attempts < RESET_CODE_VERIFY_LIMIT) {
      throw this.invalidResetCode();
    }
    await this.clearResetCode(user);
    throw new UnauthorizedException({
      code: "RESET_CODE_MAX_ATTEMPTS",
      message: "Too many attempts. Request a new code.",
    });
  }

  private async clearResetCode(user: Pick<UserEntity, "id" | "email">) {
    await this.redisService.del(this.resetCodeKey(user.id));
    await this.redisService.del(this.resetCodeDeliveryKey(user.email));
    await this.redisService.del(this.resetAttemptsKey(user.id));
  }

  private invalidResetCode() {
    return new UnauthorizedException({
      code: "INVALID_CREDENTIALS",
      message: "Invalid reset code",
    });
  }

  private resetDeliveryUnavailable() {
    return new ServiceUnavailableException({
      code: "DELIVERY_UNAVAILABLE",
      message:
        "Password reset is temporarily unavailable. Please try again shortly.",
    });
  }

  private resetCodeKey(userId: string) {
    return `reset_code:${userId}`;
  }

  private resetCodeDeliveryKey(email: string) {
    return `reset_code_delivery:${email}`;
  }

  private resetAttemptsKey(userId: string) {
    return `reset_attempts:${userId}`;
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
    const url = new URL("/auth/reset-password", this.webBaseUrl());
    url.hash = `token=${encodeURIComponent(token)}`;
    return url.toString();
  }

  private webBaseUrl() {
    const baseUrl =
      this.config.get<string>("WEB_BASE_URL") ??
      this.config
        .get<string>("CORS_ORIGINS", DEFAULT_WEB_BASE_URL)
        .split(",")[0]
        ?.trim() ??
      DEFAULT_WEB_BASE_URL;
    return baseUrl;
  }
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function maskPhone(phone: string) {
  const prefixLength = Math.max(1, Math.min(4, phone.length - 4));
  return `${phone.slice(0, prefixLength)}••••${phone.slice(-4)}`;
}
