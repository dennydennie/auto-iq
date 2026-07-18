import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, MaxLength, Min } from "class-validator";
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from "../../../common/constants/listing.constants";

const NOTIFICATION_TEMPLATE_KEYS = [
  "OTP_VERIFY",
  "PASSWORD_RESET",
  "LISTING_SUBMITTED",
  "LISTING_CHANGES_REQUESTED",
  "LISTING_PUBLISHED",
  "LISTING_REJECTED",
  "INSPECTION_ASSIGNED",
  "INSPECTION_COMPLETE",
  "VIEWING_REQUESTED",
  "VIEWING_CONFIRMED",
  "VIEWING_RESCHEDULED",
  "VIEWING_CANCELLED",
  "VIEWING_REMINDER_24H",
  "VIEWING_REMINDER_1H",
  "QUOTE_RECEIVED",
  "QUOTE_ACCEPTED",
  "QUOTE_DECLINED",
  "VEHICLE_REQUEST_ACKNOWLEDGED",
  "VEHICLE_REQUEST_MATCH_FOUND",
] as const;

export class NotificationListQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @MaxLength(100)
  recipientId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_CHANNELS)
  channel?: (typeof NOTIFICATION_CHANNELS)[number];

  @IsOptional()
  @IsIn(NOTIFICATION_TEMPLATE_KEYS)
  template?: (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

  @IsOptional()
  @IsIn(NOTIFICATION_STATUSES)
  status?: (typeof NOTIFICATION_STATUSES)[number];

  @IsOptional()
  @IsIn(["createdAt", "lastAttemptAt", "attemptCount"])
  sortBy?: "createdAt" | "lastAttemptAt" | "attemptCount";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}
