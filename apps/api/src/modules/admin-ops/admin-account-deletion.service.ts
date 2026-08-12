import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccountDeletionRequestRepository } from "../../db/repository/account-deletion-request.repository";
import { AuditService } from "../audit/audit.service";
import type {
  AdminAccountDeletionRequestListQueryDto,
  ProcessAdminAccountDeletionRequestDto,
} from "./dto/admin-secondary.dto";

@Injectable()
export class AdminAccountDeletionService {
  constructor(
    private readonly auditService: AuditService,
    private readonly deletionRequests: AccountDeletionRequestRepository,
  ) {}

  async list(query: AdminAccountDeletionRequestListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.deletionRequests.findAdminPage({
      page,
      limit,
      status: query.status,
      search: query.search?.trim(),
    });
    return {
      data: rows.map(toAdminDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async process(
    adminUserId: string,
    correlationId: string | undefined,
    requestId: string,
    body: ProcessAdminAccountDeletionRequestDto,
  ) {
    assertCompletionAttestation(body);
    const existing = await this.deletionRequests.findForAdmin(requestId);
    if (!existing) throw requestNotFound();
    if (existing.status !== "PENDING") throw alreadyProcessed();

    const processed = await this.deletionRequests.processPending(requestId, {
      dataHandlingConfirmed: body.dataHandlingConfirmed,
      identityVerified: body.identityVerified,
      processedAt: new Date(),
      processedByUserId: adminUserId,
      processingNote: body.note.trim(),
      status: body.status,
    });
    if (!processed) throw alreadyProcessed();
    await this.audit(adminUserId, correlationId, processed.id, body);
    return toAdminDto(processed);
  }

  private async audit(
    adminUserId: string,
    correlationId: string | undefined,
    requestId: string,
    body: ProcessAdminAccountDeletionRequestDto,
  ) {
    const action = `account.deletion_${body.status.toLowerCase()}`;
    await this.auditService.record({
      action,
      actorUserId: adminUserId,
      entityType: "account_deletion_request",
      entityId: requestId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action,
      adminId: adminUserId,
      entityType: "account_deletion_request",
      entityId: requestId,
      note: body.note.trim(),
    });
  }
}

function assertCompletionAttestation(
  body: ProcessAdminAccountDeletionRequestDto,
) {
  if (
    body.status === "COMPLETED" &&
    (!body.identityVerified || !body.dataHandlingConfirmed)
  ) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message:
        "Completion requires identity verification and confirmation that deletion or de-identification has been performed",
    });
  }
}

type AdminDeletionRequest = NonNullable<
  Awaited<
    ReturnType<AccountDeletionRequestRepository["findForAdmin"]>
  >
>;

function toAdminDto(request: AdminDeletionRequest) {
  return {
    id: request.id,
    email: request.email,
    source: request.source,
    status: request.status,
    reason: request.reason,
    identityVerified: request.identityVerified,
    dataHandlingConfirmed: request.dataHandlingConfirmed,
    processingNote: request.processingNote,
    processedBy: request.processedBy
      ? {
          id: request.processedBy.id,
          fullName: request.processedBy.fullName,
        }
      : null,
    requestedAt: request.requestedAt.toISOString(),
    processedAt: request.processedAt?.toISOString() ?? null,
  };
}

function requestNotFound() {
  return new NotFoundException({
    code: "RESOURCE_NOT_FOUND",
    message: "Account deletion request not found",
  });
}

function alreadyProcessed() {
  return new ConflictException({
    code: "RESOURCE_CONFLICT",
    message: "Account deletion request has already been processed",
  });
}
