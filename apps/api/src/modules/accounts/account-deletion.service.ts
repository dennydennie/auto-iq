import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { QueryFailedError } from "typeorm";
import type { AccountDeletionRequestSource } from "../../db/entity/account-deletion-request.entity";
import { AccountDeletionRequestRepository } from "../../db/repository/account-deletion-request.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { AuditService } from "../audit/audit.service";
import { RateLimitService } from "../identity/rate-limit.service";
import type {
  AccountDeletionRequestDto,
  PublicAccountDeletionRequestDto,
} from "./dto/accounts.dto";

const PUBLIC_REQUEST_LIMIT = 3;
const PUBLIC_REQUEST_WINDOW_SECONDS = 60 * 60 * 24;

@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly auditService: AuditService,
    private readonly deletionRequests: AccountDeletionRequestRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly users: UserRepository,
  ) {}

  async requestAuthenticated(userId: string, body: AccountDeletionRequestDto) {
    const user = await this.users.findById(userId);
    if (!user) throw userNotFound();
    const existing = await this.deletionRequests.findPendingByUser(user.id);
    if (!existing) {
      await this.create(user.email, body.client, body.reason, user.id);
    }
    return accepted();
  }

  async requestPublic(body: PublicAccountDeletionRequestDto, clientIp: string) {
    const email = body.email.trim().toLowerCase();
    await this.consumePublicLimit(email, clientIp);
    const existing = await this.deletionRequests.findPendingByEmail(email);
    if (existing) return accepted();
    await this.create(email, "PUBLIC_WEB", body.reason, null);
    return accepted();
  }

  private async consumePublicLimit(email: string, clientIp: string) {
    const key = createHash("sha256")
      .update(`${email}:${clientIp}`)
      .digest("hex");
    await this.rateLimitService.consume(
      `account-deletion:${key}`,
      PUBLIC_REQUEST_LIMIT,
      PUBLIC_REQUEST_WINDOW_SECONDS,
    );
  }

  private async create(
    email: string,
    source: AccountDeletionRequestSource,
    reason: string | undefined,
    userId: string | null,
  ) {
    const request = this.deletionRequests.create({
      email,
      reason: normalizeReason(reason),
      source,
      status: "PENDING",
      userId,
    });
    const saved = await this.saveUnlessPending(request);
    if (!saved) return;
    await this.auditService.record({
      action: "account.deletion_requested",
      actorUserId: userId,
      entityType: "account_deletion_request",
      entityId: saved.id,
      outcome: "success",
    });
  }

  private async saveUnlessPending(
    request: ReturnType<AccountDeletionRequestRepository["create"]>,
  ) {
    try {
      return await this.deletionRequests.save(request);
    } catch (error) {
      if (isPendingRequestConflict(error)) return null;
      throw error;
    }
  }
}

function accepted() {
  return { accepted: true as const };
}

function normalizeReason(reason: string | undefined) {
  const value = reason?.trim() ?? "";
  return value || null;
}

function isPendingRequestConflict(error: unknown) {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  };
  return (
    driverError.code === "23505" &&
    driverError.constraint === "uq_account_deletion_requests_pending_email"
  );
}

function userNotFound() {
  return new NotFoundException({
    code: "RESOURCE_NOT_FOUND",
    message: "User not found",
  });
}
