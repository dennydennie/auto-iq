import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DbModule } from "../../db/db.module";
import { TenantEntity } from "../../db/entity/tenant.entity";
import { TenantMembershipEntity } from "../../db/entity/tenant-membership.entity";
import { TenantContextInterceptor } from "./tenant-context.interceptor";
import { TenantService } from "./tenant.service";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([TenantEntity, TenantMembershipEntity])],
  providers: [TenantService, { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor }],
  exports: [TenantService],
})
export class TenancyModule {}
