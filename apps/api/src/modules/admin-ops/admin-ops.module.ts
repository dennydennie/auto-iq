import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { InspectionsModule } from "../inspections/inspections.module";
import { ListingsModule } from "../listings/listings.module";
import { OwnershipVerificationModule } from "../ownership-verification/ownership-verification.module";
import { StorageModule } from "../storage/storage.module";
import { AdminOpsController } from "./admin-ops.controller";
import { AdminOpsGuard } from "./admin-ops.guard";
import { AdminOpsService } from "./admin-ops.service";

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
  controllers: [AdminOpsController],
  providers: [AdminOpsGuard, AdminOpsService],
})
export class AdminOpsModule {}
