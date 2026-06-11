import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { NotificationService } from "./notification.service";
import { SandboxNotificationProvider } from "./sandbox-notification.provider";

@Module({
  imports: [AuditModule, ConfigModule, DbModule, forwardRef(() => IdentityModule)],
  controllers: [NotificationsController],
  providers: [NotificationSchedulerService, NotificationService, SandboxNotificationProvider],
  exports: [NotificationService],
})
export class NotificationsModule {}
