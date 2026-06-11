import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AuditModule } from "../audit/audit.module";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import { IdentityModule } from "../identity/identity.module";
import { QuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";

@Module({
  imports: [DbModule, IdentityModule, AuditModule],
  controllers: [QuotesController],
  providers: [QuotesService, AdminOpsGuard],
})
export class QuotesModule {}
