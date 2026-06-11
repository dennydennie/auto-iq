import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { IdentityModule } from "../identity/identity.module";
import { ListingsModule } from "../listings/listings.module";
import { StorageModule } from "../storage/storage.module";
import { InspectionsController } from "./inspections.controller";
import { InspectionsService } from "./inspections.service";

@Module({
  imports: [DbModule, IdentityModule, ListingsModule, StorageModule, AuditModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
