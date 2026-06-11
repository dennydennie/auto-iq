import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { LISTING_STATUSES, OWNERSHIP_VERIFICATION_STATUSES } from "../../../common/constants/listing.constants";

export class AdminListingListQueryDto {
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
  @IsIn(LISTING_STATUSES)
  status?: (typeof LISTING_STATUSES)[number];

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "submittedAt", "price"])
  sortBy?: "createdAt" | "updatedAt" | "submittedAt" | "price";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}

export class RequestChangesDto {
  @IsString()
  @MinLength(1)
  message!: string;
}

export class RejectListingDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class DelistListingDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class UpdateOwnershipVerificationDto {
  @IsIn(["IN_REVIEW", "APPROVED", "NEEDS_CLARIFICATION", "REJECTED"])
  status!: Extract<
    (typeof OWNERSHIP_VERIFICATION_STATUSES)[number],
    "IN_REVIEW" | "APPROVED" | "NEEDS_CLARIFICATION" | "REJECTED"
  >;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignInspectionDto {
  @IsString()
  inspectorId!: string;

  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  locationNote?: string;
}

export class ApproveBuyerSummaryDto {
  @IsOptional()
  @IsString()
  buyerNote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedFindingIds?: string[];
}
