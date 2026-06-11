import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { IdentityModule } from "../identity/identity.module";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { ConsentService } from "./consent.service";

@Module({
  imports: [DbModule, IdentityModule],
  controllers: [AccountsController],
  providers: [AccountsService, ConsentService],
})
export class AccountsModule {}
