import { ForbiddenException, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { isUUID } from "class-validator";
import { Repository } from "typeorm";
import { TenantContext } from "../../common/tenancy/tenant-context";
import { TenantEntity } from "../../db/entity/tenant.entity";
import { TenantMembershipEntity } from "../../db/entity/tenant-membership.entity";

@Injectable()
export class TenantService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(TenantMembershipEntity)
    private readonly memberships: Repository<TenantMembershipEntity>,
    @Optional()
    @InjectRepository(TenantEntity)
    private readonly tenants?: Repository<TenantEntity>,
  ) {}

  async forEachTenant(callback: (tenantId: string) => Promise<void>): Promise<void> {
    const tenants = this.tenants
      ? await this.tenants.find({ select: { id: true } })
      : [{ id: this.defaultTenantId() }];
    for (const tenant of tenants) {
      await TenantContext.run({ tenantId: tenant.id }, () => callback(tenant.id));
    }
  }

  async resolve(userId: string | undefined, requestedTenantId: string | undefined): Promise<string> {
    if (!userId) {
      return this.defaultTenantId();
    }

    const tenantId = requestedTenantId ?? this.defaultTenantId();
    if (!isUUID(tenantId)) {
      throw new ForbiddenException({ code: "TENANT_ACCESS_DENIED", message: "Tenant access denied" });
    }
    const membership = await this.memberships.findOne({ where: { userId, tenantId, active: true } });
    if (!membership) {
      throw new ForbiddenException({ code: "TENANT_ACCESS_DENIED", message: "Tenant access denied" });
    }
    return tenantId;
  }

  async assertRoles(userId: string | undefined, tenantId: string, required: string[]): Promise<void> {
    if (!userId || required.length === 0) return;
    const membership = await this.memberships.findOne({
      where: required.map((role) => ({ userId, tenantId, role, active: true })),
    });
    if (!membership) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Forbidden" });
    }
  }

  private defaultTenantId(): string {
    return this.config.getOrThrow<string>("DEFAULT_TENANT_ID");
  }
}
