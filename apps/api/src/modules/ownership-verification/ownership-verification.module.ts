import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { ListingsModule } from "../listings/listings.module";
import { OwnershipVerificationService } from "./ownership-verification.service";

@Module({
  imports: [DbModule, ListingsModule, AuditModule],
  providers: [OwnershipVerificationService],
  exports: [OwnershipVerificationService],
})
export class OwnershipVerificationModule {}
