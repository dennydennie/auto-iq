import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AdminReportQueryDto } from "./dto/admin-secondary.dto";

const MAX_RANGE_DAYS = 366;

@Injectable()
export class AdminReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async operations(query: AdminReportQueryDto) {
    const range = reportRange(query);
    const params = [range.from, range.toExclusive];
    const [users, listings, viewings, notifications, retries] =
      await Promise.all([
        this.dataSource.query(USERS_REPORT, params),
        this.dataSource.query(LISTINGS_REPORT, params),
        this.dataSource.query(VIEWINGS_REPORT, params),
        this.dataSource.query(NOTIFICATIONS_REPORT, params),
        this.dataSource.query(RETRIES_REPORT, params),
      ]);
    return {
      generatedAt: new Date().toISOString(),
      range: { from: range.from, to: range.to },
      users: numericRow(users[0]),
      listings: numericRow(listings[0]),
      viewings: numericRow(viewings[0]),
      notifications: {
        ...numericRow(notifications[0]),
        retryAttempts: Number(retries[0]?.retryAttempts ?? 0),
      },
    };
  }
}

const USERS_REPORT = `SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE tm.active)::int AS active,
  COUNT(*) FILTER (WHERE NOT tm.active)::int AS suspended,
  COUNT(*) FILTER (WHERE u.email_verified OR u.phone_verified)::int AS verified
FROM tenant_memberships tm JOIN users u ON u.id = tm.user_id
WHERE tm.created_at >= $1::timestamptz AND tm.created_at < $2::timestamptz`;

const LISTINGS_REPORT = `SELECT
  COUNT(*)::int AS created,
  COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'INSPECTION_PENDING', 'OWNERSHIP_VERIFICATION_PENDING', 'APPROVED'))::int AS submitted,
  COUNT(*) FILTER (WHERE status IN ('PUBLISHED', 'RESERVED', 'SOLD'))::int AS published,
  COUNT(*) FILTER (WHERE status = 'SOLD')::int AS sold
FROM vehicles WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz`;

const VIEWINGS_REPORT = `SELECT
  COUNT(*) FILTER (WHERE status IN ('REQUESTED', 'PENDING_SELLER_CONFIRMATION'))::int AS requested,
  COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'RESCHEDULED'))::int AS confirmed,
  COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
  COUNT(*) FILTER (WHERE status IN ('CANCELLED', 'NO_SHOW'))::int AS cancelled
FROM viewing_appointments WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz`;

const NOTIFICATIONS_REPORT = `SELECT
  COUNT(*) FILTER (WHERE status = 'QUEUED')::int AS queued,
  COUNT(*) FILTER (WHERE status = 'SENT')::int AS sent,
  COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
  COUNT(*) FILTER (WHERE status = 'DEAD_LETTER')::int AS "deadLetter"
FROM notifications WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz`;

const RETRIES_REPORT = `SELECT COUNT(*) FILTER (WHERE attempt_number > 1)::int AS "retryAttempts"
FROM notification_attempts WHERE created_at >= $1::timestamptz AND created_at < $2::timestamptz`;

function reportRange(query: AdminReportQueryDto) {
  const today = new Date();
  const from = query.from ?? isoDate(new Date(today.getTime() - 29 * 86_400_000));
  const to = query.to ?? isoDate(today);
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toExclusive = new Date(`${to}T00:00:00.000Z`);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  const days = (toExclusive.getTime() - fromDate.getTime()) / 86_400_000;
  if (days < 1 || days > MAX_RANGE_DAYS) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: `Report range must be between 1 and ${MAX_RANGE_DAYS} days`,
    });
  }
  return { from, to, toExclusive: toExclusive.toISOString() };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function numericRow(row: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(row ?? {}).map(([key, value]) => [key, Number(value ?? 0)]),
  );
}
