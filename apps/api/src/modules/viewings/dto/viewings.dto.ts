import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, Max, Min, MinLength } from "class-validator";
import { VIEWING_STATUSES } from "../../../common/constants/listing.constants";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TWENTY_FOUR_HOUR_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class RequestViewingDto {
  @Matches(ISO_DATE_PATTERN)
  preferredDate!: string;

  @Matches(TWENTY_FOUR_HOUR_TIME_PATTERN)
  preferredTime!: string;

  @IsString()
  locationId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ViewingListQueryDto {
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
  @IsIn(VIEWING_STATUSES)
  status?: (typeof VIEWING_STATUSES)[number];

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  date?: string;

  @IsOptional()
  @IsIn(["confirmedSlot", "createdAt"])
  sortBy?: "confirmedSlot" | "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}

export class AdminViewingListQueryDto extends ViewingListQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ConfirmViewingDto {
  @IsISO8601()
  confirmedAt!: string;

  @IsString()
  locationId!: string;

  @IsOptional()
  @IsString()
  noteToParticipants?: string;
}

export class RescheduleViewingDto {
  @IsISO8601()
  newSlot!: string;

  @IsString()
  @MinLength(1)
  reason!: string;
}

export class CancelViewingDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class CompleteViewingDto {
  @IsIn(["COMPLETED", "NO_SHOW"])
  outcome!: "COMPLETED" | "NO_SHOW";

  @IsOptional()
  @IsString()
  note?: string;
}
