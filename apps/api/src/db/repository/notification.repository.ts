import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
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

  findRetryable(now: Date, limit: number): Promise<NotificationEntity[]> {
    return this.repository.createQueryBuilder("notification")
      .leftJoinAndSelect("notification.recipient", "recipient")
      .leftJoinAndSelect("notification.attempts", "attempts")
      .where("notification.status = 'FAILED'")
      .andWhere("notification.retry_after IS NOT NULL")
      .andWhere("notification.retry_after <= :now", { now: now.toISOString() })
      .orderBy("notification.retry_after", "ASC")
      .limit(limit)
      .getMany();
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
