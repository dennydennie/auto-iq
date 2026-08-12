import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { InspectionsModule } from "../inspections/inspections.module";
import { ListingsModule } from "../listings/listings.module";
import { OwnershipVerificationModule } from "../ownership-verification/ownership-verification.module";
import { StorageModule } from "../storage/storage.module";
import { AdminOpsController } from "./admin-ops.controller";
import { AdminAccountDeletionService } from "./admin-account-deletion.service";
import { AdminOpsGuard } from "./admin-ops.guard";
import { AdminOpsService } from "./admin-ops.service";
import { AdminReportsService } from "./admin-reports.service";
import { AdminSecondaryController } from "./admin-secondary.controller";
import { AdminSettingsService } from "./admin-settings.service";
import { AdminUsersService } from "./admin-users.service";

@Module({
  imports: [
    DbModule,
    IdentityModule,
    ListingsModule,
    StorageModule,
    InspectionsModule,
    OwnershipVerificationModule,
    AuditModule,
  ],
  controllers: [AdminOpsController, AdminSecondaryController],
  providers: [
    AdminAccountDeletionService,
    AdminOpsGuard,
    AdminOpsService,
    AdminReportsService,
    AdminSettingsService,
    AdminUsersService,
  ],
})
export class AdminOpsModule {}
