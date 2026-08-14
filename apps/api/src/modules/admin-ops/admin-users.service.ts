import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import { AuditService } from "../audit/audit.service";
import {
  AdminUserListQueryDto,
  UpdateAdminInspectorRoleDto,
  UpdateAdminUserAccessDto,
} from "./dto/admin-secondary.dto";

interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  roles: string[];
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
    const total = await this.countUsers(filter);
    const rows = await this.listUsers(query, filter, page, limit);
    return {
      data: rows.map(toAdminUser),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async updateAccess(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    body: UpdateAdminUserAccessDto,
  ) {
    this.assertNotSelfSuspension(adminUserId, userId, body.active);
    await this.dataSource.transaction((manager) =>
      this.updateMembershipAccess(manager, userId, body.active),
    );
    await this.auditAccess(adminUserId, correlationId, userId, body.active);
    return this.requireUser(this.dataSource, userId);
  }

  async updateInspectorRole(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    body: UpdateAdminInspectorRoleDto,
  ) {
    await this.dataSource.transaction((manager) =>
      this.changeInspectorRole(manager, userId, body.granted),
    );
    await this.auditInspectorRole(
      adminUserId,
      correlationId,
      userId,
      body.granted,
    );
    return this.requireUser(this.dataSource, userId);
  }

  private async countUsers(filter: UserFilter): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total ${USER_FROM} ${filter.where}`,
      filter.params,
    );
    return Number(rows[0]?.total ?? 0);
  }

  private async listUsers(
    query: AdminUserListQueryDto,
    filter: UserFilter,
    page: number,
    limit: number,
  ): Promise<AdminUserRow[]> {
    return this.dataSource.query(
      `${USER_SELECT} ${USER_FROM} ${filter.where} ${userOrder(query)} LIMIT $${filter.params.length + 1} OFFSET $${filter.params.length + 2}`,
      [...filter.params, limit, (page - 1) * limit],
    );
  }

  private assertNotSelfSuspension(
    adminUserId: string,
    userId: string,
    active: boolean,
  ) {
    if (active || adminUserId !== userId) return;
    throw new ConflictException({
      code: "VALIDATION_FAILED",
      message: "You cannot suspend your own admin access",
    });
  }

  private async updateMembershipAccess(
    manager: EntityManager,
    userId: string,
    active: boolean,
  ) {
    const user = await this.lockUser(manager, userId);
    if (!active && user.roles.includes("ADMIN")) {
      await this.assertAnotherAdmin(manager);
    }
    await manager.query(
      "UPDATE tenant_memberships SET active = $1 WHERE user_id = $2",
      [active, userId],
    );
  }

  private async changeInspectorRole(
    manager: EntityManager,
    userId: string,
    granted: boolean,
  ) {
    const user = await this.lockUser(manager, userId);
    if (granted) {
      await this.grantInspectorRole(manager, userId);
      return;
    }
    await this.revokeInspectorRole(manager, userId, user.roles);
  }

  private async lockUser(manager: EntityManager, userId: string) {
    const rows = await manager.query(
      "SELECT id FROM tenant_memberships WHERE user_id = $1 FOR UPDATE",
      [userId],
    );
    if (!rows[0]) this.userNotFound();
    return this.requireUser(manager, userId);
  }

  private async grantInspectorRole(manager: EntityManager, userId: string) {
    await manager.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'INSPECTOR')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId],
    );
    await manager.query(
      `${INSPECTOR_MEMBERSHIP_INSERT}
       ON CONFLICT (user_id, tenant_id, role)
       DO UPDATE SET active = EXCLUDED.active`,
      [userId],
    );
  }

  private async revokeInspectorRole(
    manager: EntityManager,
    userId: string,
    roles: string[],
  ) {
    if (!roles.includes("INSPECTOR")) return;
    if (roles.length === 1) this.rejectOnlyRoleRemoval();
    await this.assertNoOpenInspectionTasks(manager, userId);
    await manager.query(
      "DELETE FROM tenant_memberships WHERE user_id = $1 AND role = 'INSPECTOR'",
      [userId],
    );
    await manager.query(
      "DELETE FROM user_roles WHERE user_id = $1 AND role = 'INSPECTOR'",
      [userId],
    );
  }

  private async assertNoOpenInspectionTasks(
    manager: EntityManager,
    userId: string,
  ) {
    const rows = await manager.query(
      `SELECT COUNT(*)::int AS total FROM inspection_tasks
       WHERE assigned_inspector_id = $1 AND status IN ('SCHEDULED', 'IN_PROGRESS')`,
      [userId],
    );
    if (Number(rows[0]?.total ?? 0) === 0) return;
    throw new ConflictException({
      code: "VALIDATION_FAILED",
      message: "Reassign open inspection tasks before revoking Inspector",
    });
  }

  private async assertAnotherAdmin(manager: EntityManager) {
    const rows = await manager.query(
      "SELECT COUNT(*)::int AS total FROM tenant_memberships WHERE role = 'ADMIN' AND active = true",
    );
    if (Number(rows[0]?.total ?? 0) > 1) return;
    throw new ConflictException({
      code: "VALIDATION_FAILED",
      message: "At least one active admin must remain",
    });
  }

  private async requireUser(
    queryable: Pick<DataSource, "query"> | Pick<EntityManager, "query">,
    userId: string,
  ) {
    const rows = await queryable.query(
      `${USER_SELECT} ${USER_FROM} WHERE tm.user_id = $1`,
      [userId],
    );
    if (!rows[0]) this.userNotFound();
    return toAdminUser(rows[0] as AdminUserRow);
  }

  private userNotFound(): never {
    throw new NotFoundException({
      code: "RESOURCE_NOT_FOUND",
      message: "User not found",
    });
  }

  private rejectOnlyRoleRemoval(): never {
    throw new ConflictException({
      code: "VALIDATION_FAILED",
      message: "Assign another role before revoking Inspector",
    });
  }

  private async auditAccess(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    active: boolean,
  ) {
    await this.auditRoleChange(
      "user.access.update",
      adminUserId,
      correlationId,
      userId,
      active ? "Tenant access restored" : "Tenant access suspended",
    );
  }

  private async auditInspectorRole(
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    granted: boolean,
  ) {
    await this.auditRoleChange(
      "user.inspector-role.update",
      adminUserId,
      correlationId,
      userId,
      granted ? "Inspector role granted" : "Inspector role revoked",
    );
  }

  private async auditRoleChange(
    action: string,
    adminUserId: string,
    correlationId: string | undefined,
    userId: string,
    note: string,
  ) {
    await this.auditService.record({
      action,
      actorUserId: adminUserId,
      entityType: "user",
      entityId: userId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action,
      adminId: adminUserId,
      entityType: "user",
      entityId: userId,
      note,
    });
  }
}

const ROLE_ORDER = `CASE role
  WHEN 'ADMIN' THEN 1
  WHEN 'SELLER' THEN 2
  WHEN 'BUYER' THEN 3
  ELSE 4
END`;
const USER_SELECT = `SELECT u.id, u.full_name, u.email, u.phone, u.city,
  u.status AS account_status, u.email_verified, u.phone_verified,
  u.created_at, tm.role, tm.roles, tm.access_active`;
const USER_FROM = `FROM (
  SELECT user_id,
    (array_agg(role ORDER BY ${ROLE_ORDER}))[1] AS role,
    array_agg(role ORDER BY ${ROLE_ORDER}) AS roles,
    bool_or(active) AS access_active
  FROM tenant_memberships
  GROUP BY user_id
) tm JOIN users u ON u.id = tm.user_id`;
const INSPECTOR_MEMBERSHIP_INSERT = `INSERT INTO tenant_memberships
  (tenant_id, user_id, role, active)
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid,
    $1, 'INSPECTOR', bool_or(active)
  FROM tenant_memberships
  WHERE user_id = $1
  GROUP BY user_id`;

interface UserFilter {
  where: string;
  params: unknown[];
}

function buildUserFilter(query: AdminUserListQueryDto): UserFilter {
  const conditions: string[] = [];
  const params: unknown[] = [];
  addSearchFilter(query.search, conditions, params);
  addRoleFilter(query.role, conditions, params);
  addAccessFilter(query.access, conditions, params);
  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

function addSearchFilter(
  search: string | undefined,
  conditions: string[],
  params: unknown[],
) {
  if (!search?.trim()) return;
  params.push(`%${search.trim()}%`);
  conditions.push(
    `(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`,
  );
}

function addRoleFilter(
  role: string | undefined,
  conditions: string[],
  params: unknown[],
) {
  if (!role) return;
  params.push(role);
  conditions.push(`$${params.length} = ANY(tm.roles)`);
}

function addAccessFilter(
  access: "ACTIVE" | "SUSPENDED" | undefined,
  conditions: string[],
  params: unknown[],
) {
  if (!access) return;
  params.push(access === "ACTIVE");
  conditions.push(`tm.access_active = $${params.length}`);
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
    roles: row.roles ?? [row.role],
    accountStatus: row.account_status,
    accessActive: row.access_active,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified,
    createdAt: row.created_at.toISOString(),
  };
}
