import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../storage/storage.module";
import { ViewingsController } from "./viewings.controller";
import { ViewingsService } from "./viewings.service";
import { ViewingStateService } from "./viewing-state.service";

@Module({
  imports: [DbModule, IdentityModule, NotificationsModule, StorageModule, AuditModule],
  controllers: [ViewingsController],
  providers: [AdminOpsGuard, ViewingsService, ViewingStateService],
  exports: [ViewingsService],
})
export class ViewingsModule {}
