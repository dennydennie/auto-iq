import type { NotificationChannel, NotificationStatus } from './enums.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';

// ─── Template keys ────────────────────────────────────────────────────────────
// Mirrors template IDs configured in the notifications module env.

export const NOTIFICATION_TEMPLATES = [
  'OTP_VERIFY',
  'PASSWORD_RESET',
  'LISTING_SUBMITTED',
  'LISTING_CHANGES_REQUESTED',
  'LISTING_PUBLISHED',
  'LISTING_REJECTED',
  'INSPECTION_ASSIGNED',
  'INSPECTION_COMPLETE',
  'VIEWING_REQUESTED',
  'VIEWING_CONFIRMED',
  'VIEWING_RESCHEDULED',
  'VIEWING_CANCELLED',
  'VIEWING_REMINDER_24H',
  'VIEWING_REMINDER_1H',
  'QUOTE_RECEIVED',
  'QUOTE_ACCEPTED',
  'QUOTE_DECLINED',
  'VEHICLE_REQUEST_ACKNOWLEDGED',
  'VEHICLE_REQUEST_MATCH_FOUND',
] as const;

export type NotificationTemplate = (typeof NOTIFICATION_TEMPLATES)[number];

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface NotificationAttemptDto {
  id: string;
  attemptNumber: number;
  status: NotificationStatus;
  providerRef?: string;
  /** ISO-8601 */
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  recipientId: string;
  recipientName: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  /** Idempotency key — one per business event per recipient */
  idempotencyKey: string;
  status: NotificationStatus;
  /** Total send attempts so far */
  attemptCount: number;
  /** ISO-8601 of last attempt */
  lastAttemptAt?: string;
  attempts: NotificationAttemptDto[];
  createdAt: string;
  updatedAt: string;
}

// ─── List params (admin) ──────────────────────────────────────────────────────

export interface NotificationListParams extends OffsetPaginationParams {
  recipientId?: string;
  channel?: NotificationChannel;
  template?: NotificationTemplate;
  status?: NotificationStatus;
  sortBy?: 'createdAt' | 'lastAttemptAt' | 'attemptCount';
  sortDir?: SortDirection;
}

// ─── Retry request ────────────────────────────────────────────────────────────

export interface RetryNotificationRequest {
  notificationId: string;
}
