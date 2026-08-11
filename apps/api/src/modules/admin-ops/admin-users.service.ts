import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import { AuditService } from "../audit/audit.service";
import {
  AdminUserListQueryDto,
  UpdateAdminUserAccessDto,
} from "./dto/admin-secondary.dto";

interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  account_status: string;
  access_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: Date;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: AdminUserListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = buildUserFilter(query);
    const countRows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total ${USER_FROM} ${filter.where}`,
      filter.params,
    );
    const rows = await this.dataSource.query(
      `${USER_SELECT} ${USER_FROM} ${filter.where} ${userOrder(query)} LIMIT $${filter.params.length + 1} OFFSET $${filter.params.length + 2}`,
      [...filter.params, limit, (page - 1) * limit],
    );
    const total = Number(countRows[0]?.total ?? 0);
    return {
      data: (rows as AdminUserRow[]).map(toAdminUser),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async updateAccess(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    body: UpdateAdminUserAccessDto,
  ) {
    if (!body.active && adminUserId === userId) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "You cannot suspend your own admin access",
      });
    }
    await this.dataSource.transaction((manager) =>
      this.updateMembership(manager, userId, body.active),
    );
    await this.auditAccess(adminUserId, correlationId, userId, body.active);
    return this.requireUser(this.dataSource, userId);
  }

  private async updateMembership(
    manager: EntityManager,
    userId: string,
    active: boolean,
  ) {
    const user = await this.requireUser(manager, userId, true);
    if (!active && user.role === "ADMIN") {
      await this.assertAnotherAdmin(manager);
    }
    await manager.query(
      `UPDATE tenant_memberships SET active = $1 WHERE user_id = $2 AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid`,
      [active, userId],
    );
  }

  private async assertAnotherAdmin(manager: EntityManager) {
    const rows = await manager.query(
      `SELECT COUNT(*)::int AS total FROM tenant_memberships WHERE role = 'ADMIN' AND active = true`,
    );
    if (Number(rows[0]?.total ?? 0) <= 1) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "At least one active admin must remain",
      });
    }
  }

  private async requireUser(
    queryable: Pick<DataSource, "query"> | Pick<EntityManager, "query">,
    userId: string,
    lock = false,
  ) {
    const rows = await queryable.query(
      `${USER_SELECT} ${USER_FROM} WHERE tm.user_id = $1${lock ? " FOR UPDATE OF tm" : ""}`,
      [userId],
    );
    if (!rows[0]) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "User not found",
      });
    }
    return toAdminUser(rows[0] as AdminUserRow);
  }

  private async auditAccess(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    active: boolean,
  ) {
    await this.auditService.record({
      action: "user.access.update",
      actorUserId: adminUserId,
      entityType: "user",
      entityId: userId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "user.access.update",
      adminId: adminUserId,
      entityType: "user",
      entityId: userId,
      note: active ? "Tenant access restored" : "Tenant access suspended",
    });
  }
}

const USER_SELECT = `SELECT u.id, u.full_name, u.email, u.phone, u.city,
  u.status AS account_status, u.email_verified, u.phone_verified,
  u.created_at, tm.role, tm.active AS access_active`;
const USER_FROM = `FROM tenant_memberships tm JOIN users u ON u.id = tm.user_id`;

function buildUserFilter(query: AdminUserListQueryDto) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (query.search?.trim()) {
    params.push(`%${query.search.trim()}%`);
    conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
  }
  if (query.role) {
    params.push(query.role);
    conditions.push(`tm.role = $${params.length}`);
  }
  if (query.access) {
    params.push(query.access === "ACTIVE");
    conditions.push(`tm.active = $${params.length}`);
  }
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

function userOrder(query: AdminUserListQueryDto) {
  const column = query.sortBy === "fullName" ? "u.full_name" : "u.created_at";
  return `ORDER BY ${column} ${query.sortDir === "ASC" ? "ASC" : "DESC"}, u.id ASC`;
}

function toAdminUser(row: AdminUserRow) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    role: row.role,
    accountStatus: row.account_status,
    accessActive: row.access_active,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified,
    createdAt: row.created_at.toISOString(),
  };
}
