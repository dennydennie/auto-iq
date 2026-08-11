import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { ConsentService } from "./consent.service";
import { ReferenceDataModule } from "../reference-data/reference-data.module";

@Module({
  imports: [DbModule, IdentityModule, ReferenceDataModule],
  controllers: [AccountsController],
  providers: [AccountsService, ConsentService],
})
export class AccountsModule {}
