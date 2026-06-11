import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import { IdentityModule } from "../identity/identity.module";
import { ReferenceDataModule } from "../reference-data/reference-data.module";
import { VehicleRequestsController } from "./vehicle-requests.controller";
import { VehicleRequestsService } from "./vehicle-requests.service";

@Module({
  imports: [DbModule, IdentityModule, AuditModule, ReferenceDataModule],
  controllers: [VehicleRequestsController],
  providers: [VehicleRequestsService, AdminOpsGuard],
})
export class VehicleRequestsModule {}
