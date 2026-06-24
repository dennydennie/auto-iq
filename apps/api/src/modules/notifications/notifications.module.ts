import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { ConfigurableNotificationProvider } from "./configurable-notification.provider";
import { NotificationProvider } from "./notification-provider";
import { NotificationsController } from "./notifications.controller";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { NotificationService } from "./notification.service";

@Module({
  imports: [AuditModule, ConfigModule, DbModule, forwardRef(() => IdentityModule)],
  controllers: [NotificationsController],
  providers: [
    ConfigurableNotificationProvider,
    NotificationSchedulerService,
    NotificationService,
    { provide: NotificationProvider, useExisting: ConfigurableNotificationProvider },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
