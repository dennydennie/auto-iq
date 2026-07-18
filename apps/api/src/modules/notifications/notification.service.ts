import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NotificationChannel, NotificationStatus } from "../../common/constants/listing.constants";
import { NotificationAttemptRepository } from "../../db/repository/notification-attempt.repository";
import { NotificationRepository } from "../../db/repository/notification.repository";
import { ViewingAppointmentRepository } from "../../db/repository/viewing-appointment.repository";
import { AuditService } from "../audit/audit.service";
import { NotificationListQueryDto } from "./dto/notifications.dto";
import { NotificationProvider, type ProviderSendInput } from "./notification-provider";

const MAX_NOTIFICATION_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 300;
type NotificationTemplateKey =
  | "OTP_VERIFY"
  | "PASSWORD_RESET"
  | "LISTING_SUBMITTED"
  | "LISTING_CHANGES_REQUESTED"
  | "LISTING_PUBLISHED"
  | "LISTING_REJECTED"
  | "INSPECTION_ASSIGNED"
  | "INSPECTION_COMPLETE"
  | "VIEWING_REQUESTED"
  | "VIEWING_CONFIRMED"
  | "VIEWING_RESCHEDULED"
  | "VIEWING_CANCELLED"
  | "VIEWING_REMINDER_24H"
  | "VIEWING_REMINDER_1H"
  | "QUOTE_RECEIVED"
  | "QUOTE_ACCEPTED"
  | "QUOTE_DECLINED"
  | "VEHICLE_REQUEST_ACKNOWLEDGED"
  | "VEHICLE_REQUEST_MATCH_FOUND";
const REMINDER_WINDOWS = [
  { hours: 24, template: "VIEWING_REMINDER_24H" },
  { hours: 1, template: "VIEWING_REMINDER_1H" },
] as const;

interface SendNotificationInput {
  recipientUserId: string;
  channel: NotificationChannel;
  template: NotificationTemplateKey;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  recipientAddress: string;
}

interface NotifyUserInput {
  userId: string;
  email: string;
  phone: string;
  template: NotificationTemplateKey;
  idempotencyKeyBase: string;
  payload: Record<string, unknown>;
  channels?: NotificationChannel[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly notificationAttemptRepository: NotificationAttemptRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly provider: NotificationProvider,
    private readonly viewingRepository: ViewingAppointmentRepository,
  ) {}

  async send(input: SendNotificationInput) {
    const existing = await this.notificationRepository.findByIdempotency(
      input.recipientUserId,
      input.channel,
      input.idempotencyKey,
    );
    if (existing) {
      return this.toDto(existing);
    }

    const draft = this.notificationRepository.create({
      recipientUserId: input.recipientUserId,
      channel: input.channel,
      template: input.template,
      idempotencyKey: input.idempotencyKey,
      status: "QUEUED",
      recipientAddress: input.recipientAddress,
      payload: input.payload,
      attemptCount: 0,
      lastAttemptAt: null,
      retryAfter: null,
      providerRef: null,
      claimToken: null,
      claimExpiresAt: null,
    });
    let notification;
    try {
      notification = await this.notificationRepository.save(draft);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.notificationRepository.findByIdempotency(
        input.recipientUserId,
        input.channel,
        input.idempotencyKey,
      );
      if (!raced) throw error;
      return this.toDto(raced);
    }
    return this.deliver(notification.id);
  }

  async notifyUser(input: NotifyUserInput) {
    const channels = input.channels ?? this.activeChannels();
    const deliveries = channels.flatMap((channel) => {
      const address = channel === "EMAIL" ? input.email : input.phone;
      if (!address) {
        return [];
      }
      return [this.send({
        recipientUserId: input.userId,
        channel,
        template: input.template,
        idempotencyKey: `${input.idempotencyKeyBase}:${channel}`,
        payload: input.payload,
        recipientAddress: address,
      })];
    });
    return Promise.all(deliveries);
  }

  async list(query: NotificationListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.notificationRepository.findAdminPage({
      page,
      limit,
      recipientId: query.recipientId,
      channel: query.channel,
      template: query.template,
      status: query.status,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });

    return {
      data: await Promise.all(rows.map((row) => this.hydrateDto(row.id))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async retry(notificationId: string, actorUserId: string, correlationId?: string) {
    const notification = await this.notificationRepository.findByIdWithRelations(notificationId);
    if (!notification) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Notification not found" });
    }
    const claimToken = await this.notificationRepository.claimById(
      notificationId,
      new Date(),
      this.claimLeaseSeconds(),
    );
    if (!claimToken) {
      throw new ConflictException({ code: "NOTIFICATION_IN_PROGRESS", message: "Notification delivery is already in progress" });
    }
    const result = await this.deliver(notificationId, true, claimToken);
    await this.auditService.record({
      action: "notification.retry",
      actorUserId,
      entityType: "notification",
      entityId: notificationId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "notification.retry",
      adminId: actorUserId,
      entityType: "notification",
      entityId: notificationId,
    });
    return result;
  }

  async processPendingRetries(now = new Date()) {
    const retryable = await this.notificationRepository.claimRetryable(now, 25, this.claimLeaseSeconds());
    for (const claim of retryable) {
      await this.deliver(claim.notification.id, true, claim.token);
    }
    return retryable.length;
  }

  async processViewingReminders(now = new Date()) {
    const pollWindowMs = this.pollIntervalMs();
    let sent = 0;
    for (const window of REMINDER_WINDOWS) {
      const target = new Date(now.getTime() + window.hours * 60 * 60 * 1000);
      const windowStart = new Date(target.getTime() - pollWindowMs);
      const windowEnd = new Date(target.getTime() + pollWindowMs);
      const viewings = await this.viewingRepository.findRemindersDue(windowStart, windowEnd);
      for (const viewing of viewings) {
        const payload = {
          viewingId: viewing.id,
          listingId: viewing.listingId,
          slot: viewing.confirmedSlot?.toISOString() ?? null,
          locationName: viewing.location?.name ?? null,
        };
        await this.notifyUser({
          userId: viewing.buyer.id,
          email: viewing.buyer.email,
          phone: viewing.buyer.phone,
          template: window.template,
          idempotencyKeyBase: `viewing:${viewing.id}:${window.template}:buyer`,
          payload,
        });
        await this.notifyUser({
          userId: viewing.seller.id,
          email: viewing.seller.email,
          phone: viewing.seller.phone,
          template: window.template,
          idempotencyKeyBase: `viewing:${viewing.id}:${window.template}:seller`,
          payload,
        });
        sent += 2;
      }
    }
    return sent;
  }

  private async deliver(notificationId: string, force = false, claimToken?: string) {
    const notification = await this.notificationRepository.findByIdWithRelations(notificationId);
    if (!notification) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Notification not found" });
    }
    if (!force && notification.status === "SENT") {
      return this.toDto(notification);
    }
    if (claimToken && notification.claimToken !== claimToken) {
      throw new ConflictException({ code: "NOTIFICATION_IN_PROGRESS", message: "Notification delivery claim is no longer valid" });
    }

    const attemptNumber = notification.attemptCount + 1;
    const attempt = this.notificationAttemptRepository.create({
      notificationId: notification.id,
      attemptNumber,
      status: "QUEUED",
      providerRef: null,
      sentAt: null,
      errorMessage: null,
    });

    try {
      const result = await this.provider.send({
        channel: notification.channel,
        recipientAddress: notification.recipientAddress,
        template: notification.template,
        payload: notification.payload,
      } satisfies ProviderSendInput);
      attempt.status = "SENT";
      attempt.providerRef = result.providerRef;
      attempt.sentAt = new Date();
      await this.notificationAttemptRepository.save(attempt);

      await this.notificationRepository.updateDeliveryState(notification.id, {
        status: "SENT",
        attemptCount: attemptNumber,
        lastAttemptAt: attempt.sentAt,
        retryAfter: null,
        providerRef: result.providerRef,
        claimToken: null,
        claimExpiresAt: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown notification failure";
      attempt.status = this.nextFailureStatus(attemptNumber);
      attempt.errorMessage = message;
      await this.notificationAttemptRepository.save(attempt);

      const failedAt = new Date();
      await this.notificationRepository.updateDeliveryState(notification.id, {
        status: attempt.status,
        attemptCount: attemptNumber,
        lastAttemptAt: failedAt,
        retryAfter: attempt.status === "DEAD_LETTER"
          ? null
          : new Date(Date.now() + this.retryDelaySeconds() * 1000 * attemptNumber),
        providerRef: notification.providerRef,
        claimToken: null,
        claimExpiresAt: null,
      });
      this.logger.error(`Notification ${notification.id} failed`, message);
    }

    return this.hydrateDto(notification.id);
  }

  private async hydrateDto(notificationId: string) {
    const notification = await this.notificationRepository.findByIdWithRelations(notificationId);
    if (!notification) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Notification not found" });
    }
    return this.toDto(notification);
  }

  private toDto(notification: {
    id: string;
    recipientUserId: string;
    recipient?: { fullName: string };
    channel: NotificationChannel;
    template: string;
    idempotencyKey: string;
    status: NotificationStatus;
    attemptCount: number;
    lastAttemptAt: Date | null;
    attempts?: Array<{
      id: string;
      attemptNumber: number;
      status: NotificationStatus;
      providerRef: string | null;
      sentAt: Date | null;
      errorMessage: string | null;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const attempts = [...(notification.attempts ?? [])].sort((left, right) => left.attemptNumber - right.attemptNumber);
    return {
      id: notification.id,
      recipientId: notification.recipientUserId,
      recipientName: notification.recipient?.fullName ?? "",
      channel: notification.channel,
      template: notification.template,
      idempotencyKey: notification.idempotencyKey,
      status: notification.status,
      attemptCount: notification.attemptCount,
      lastAttemptAt: notification.lastAttemptAt?.toISOString(),
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        providerRef: attempt.providerRef ?? undefined,
        sentAt: attempt.sentAt?.toISOString(),
        errorMessage: attempt.errorMessage ?? undefined,
        createdAt: attempt.createdAt.toISOString(),
      })),
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  }

  private activeChannels(): NotificationChannel[] {
    const configured = this.configService.get<string>("NOTIFICATION_ACTIVE_CHANNELS") ?? "EMAIL,SMS";
    return configured.split(",").map((entry) => entry.trim()).filter(Boolean) as NotificationChannel[];
  }

  private nextFailureStatus(attemptNumber: number): NotificationStatus {
    return attemptNumber >= this.maxAttempts() ? "DEAD_LETTER" : "FAILED";
  }

  private maxAttempts() {
    return Number(this.configService.get<string>("NOTIFICATION_MAX_ATTEMPTS") ?? MAX_NOTIFICATION_ATTEMPTS);
  }

  private retryDelaySeconds() {
    return Number(this.configService.get<string>("NOTIFICATION_RETRY_DELAY_SECONDS") ?? RETRY_DELAY_SECONDS);
  }

  private claimLeaseSeconds() {
    return Number(this.configService.get<string>("NOTIFICATION_CLAIM_LEASE_SECONDS") ?? 120);
  }

  private pollIntervalMs() {
    return Number(this.configService.get<string>("NOTIFICATION_REMINDER_INTERVAL_MS") ?? 300000);
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const driverError = (error as { driverError?: { code?: string } }).driverError;
  return driverError?.code === "23505";
}
