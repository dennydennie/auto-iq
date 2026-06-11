import { Injectable } from "@nestjs/common";
import { AdminActionLogRepository } from "../../db/repository/admin-action-log.repository";
import { AuditLogRepository } from "../../db/repository/audit-log.repository";

interface AuditEventInput {
  action: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  outcome: "success" | "failure";
  correlationId?: string;
}

interface AdminActionInput {
  action: string;
  adminId: string;
  entityType: string;
  entityId: string;
  note?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly adminActionLogRepository: AdminActionLogRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async record(event: AuditEventInput): Promise<void> {
    await this.auditLogRepository.save(this.auditLogRepository.create({
      action: event.action,
      actorUserId: event.actorUserId,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: event.outcome,
      correlationId: event.correlationId ?? null,
    }));
  }

  async recordAdminAction(action: AdminActionInput): Promise<void> {
    await this.adminActionLogRepository.save(this.adminActionLogRepository.create({
      action: action.action,
      adminId: action.adminId,
      entityType: action.entityType,
      entityId: action.entityId,
      note: action.note ?? null,
    }));
  }
}
