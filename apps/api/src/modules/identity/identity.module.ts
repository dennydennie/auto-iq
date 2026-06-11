import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DbModule } from "../../db/db.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RedisModule } from "../redis/redis.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CsrfService } from "./csrf.service";
import { OtpService } from "./otp.service";
import { PasswordService } from "./password.service";
import { RateLimitService } from "./rate-limit.service";
import { SessionService } from "./session.service";

@Module({
  imports: [ConfigModule, DbModule, RedisModule, forwardRef(() => NotificationsModule)],
  controllers: [AuthController],
  providers: [
    AuthGuard,
    AuthService,
    CsrfGuard,
    CsrfService,
    OtpService,
    PasswordService,
    RateLimitService,
    RolesGuard,
    SessionService,
  ],
  exports: [AuthGuard, CsrfGuard, CsrfService, PasswordService, RateLimitService, RolesGuard, SessionService],
})
export class IdentityModule {}
