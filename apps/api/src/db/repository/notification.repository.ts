import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { randomUUID } from "node:crypto";
import type { NotificationStatus } from "../../common/constants/listing.constants";
import { NotificationEntity } from "../entity/notification.entity";
import { AbstractRepository } from "./abstract.repository";

export interface NotificationPageParams {
  page: number;
  limit: number;
  recipientId?: string;
  channel?: string;
  template?: string;
  status?: string;
  sortBy: "createdAt" | "lastAttemptAt" | "attemptCount";
  sortDir: "ASC" | "DESC";
}

interface NotificationDeliveryState {
  status: NotificationStatus;
  attemptCount: number;
  lastAttemptAt: Date | null;
  retryAfter: Date | null;
  providerRef: string | null;
  claimToken: string | null;
  claimExpiresAt: Date | null;
}

export interface NotificationClaim {
  notification: NotificationEntity;
  token: string;
}

@Injectable()
export class NotificationRepository extends AbstractRepository<NotificationEntity> {
  constructor(@InjectRepository(NotificationEntity) repository: Repository<NotificationEntity>) {
    super(repository);
  }

  findByIdWithRelations(id: string): Promise<NotificationEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["recipient", "attempts"],
    });
  }

  findByIdempotency(recipientUserId: string, channel: string, idempotencyKey: string): Promise<NotificationEntity | null> {
    return this.repository.findOne({
      where: { recipientUserId, channel: channel as never, idempotencyKey },
      relations: ["recipient", "attempts"],
    });
  }

  async findAdminPage(params: NotificationPageParams): Promise<[NotificationEntity[], number]> {
    const query = this.baseQuery();
    if (params.recipientId) {
      query.andWhere("notification.recipient_user_id = :recipientId", { recipientId: params.recipientId });
    }
    if (params.channel) {
      query.andWhere("notification.channel = :channel", { channel: params.channel });
    }
    if (params.template) {
      query.andWhere("notification.template = :template", { template: params.template });
    }
    if (params.status) {
      query.andWhere("notification.status = :status", { status: params.status });
    }
    this.applySort(query, params);
    const total = await query.clone().select("notification.id").distinct(true).getCount();
    const rows = await query.skip((params.page - 1) * params.limit).take(params.limit).getMany();
    return [rows, total];
  }

  async claimRetryable(now: Date, limit: number, leaseSeconds: number): Promise<NotificationClaim[]> {
    return this.repository.manager.transaction(async (manager) => {
      const rows = await manager.createQueryBuilder(NotificationEntity, "notification")
        .leftJoinAndSelect("notification.recipient", "recipient")
        .leftJoinAndSelect("notification.attempts", "attempts")
        .where("notification.status = 'FAILED'")
        .andWhere("notification.retry_after IS NOT NULL")
        .andWhere("notification.retry_after <= :now", { now: now.toISOString() })
        .andWhere("(notification.claim_expires_at IS NULL OR notification.claim_expires_at <= :now)", { now: now.toISOString() })
        .orderBy("notification.retry_after", "ASC")
        .take(limit)
        .setLock("pessimistic_write")
        .setOnLocked("skip_locked")
        .getMany();
      const claims = rows.map((notification) => ({ notification, token: randomUUID() }));
      for (const claim of claims) {
        await manager.update(NotificationEntity, { id: claim.notification.id }, {
          claimToken: claim.token,
          claimExpiresAt: new Date(now.getTime() + leaseSeconds * 1_000),
        });
      }
      return claims;
    });
  }

  async claimById(id: string, now: Date, leaseSeconds: number): Promise<string | null> {
    const token = randomUUID();
    const result = await this.repository.createQueryBuilder()
      .update(NotificationEntity)
      .set({ claimToken: token, claimExpiresAt: new Date(now.getTime() + leaseSeconds * 1_000) })
      .where("id = :id", { id })
      .andWhere("(claim_expires_at IS NULL OR claim_expires_at <= :now)", { now: now.toISOString() })
      .andWhere("status IN ('FAILED', 'QUEUED')")
      .execute();
    return result.affected === 1 ? token : null;
  }

  async updateDeliveryState(id: string, state: NotificationDeliveryState): Promise<void> {
    await this.repository.update({ id }, state);
  }

  private baseQuery() {
    return this.repository.createQueryBuilder("notification")
      .leftJoinAndSelect("notification.recipient", "recipient");
  }

  private applySort(query: SelectQueryBuilder<NotificationEntity>, params: NotificationPageParams): void {
    if (params.sortBy === "attemptCount") {
      query.orderBy("notification.attemptCount", params.sortDir);
      return;
    }
    const column = params.sortBy === "lastAttemptAt"
      ? "notification.lastAttemptAt"
      : "notification.createdAt";
    query.orderBy(column, params.sortDir);
  }
}
