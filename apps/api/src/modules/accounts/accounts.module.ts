import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { AccountDeletionController } from "./account-deletion.controller";
import { AccountDeletionService } from "./account-deletion.service";
import { ConsentService } from "./consent.service";
import { ReferenceDataModule } from "../reference-data/reference-data.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule, DbModule, IdentityModule, ReferenceDataModule],
  controllers: [AccountDeletionController, AccountsController],
  providers: [AccountDeletionService, AccountsService, ConsentService],
})
export class AccountsModule {}
