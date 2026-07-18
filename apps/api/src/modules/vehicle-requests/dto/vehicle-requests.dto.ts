import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  URGENCY_LEVELS,
  VEHICLE_REQUEST_STATUSES,
} from "../../../common/constants/listing.constants";

export class CreateVehicleRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxBudgetCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  makeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1900)
  yearMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1900)
  yearMax?: number;

  @IsOptional()
  @IsIn(BODY_TYPES)
  bodyTypeId?: (typeof BODY_TYPES)[number];

  @IsOptional()
  @IsIn(FUEL_TYPES)
  fuelTypeId?: (typeof FUEL_TYPES)[number];

  @IsOptional()
  @IsIn(TRANSMISSION_TYPES)
  transmissionTypeId?: (typeof TRANSMISSION_TYPES)[number];

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maxOdometerKm?: number;

  @IsIn(URGENCY_LEVELS)
  urgency!: (typeof URGENCY_LEVELS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class VehicleRequestListQueryDto {
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
  @IsIn(VEHICLE_REQUEST_STATUSES)
  status?: (typeof VEHICLE_REQUEST_STATUSES)[number];

  @IsOptional()
  @IsIn(URGENCY_LEVELS)
  urgency?: (typeof URGENCY_LEVELS)[number];

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "maxBudgetCents"])
  sortBy?: "createdAt" | "updatedAt" | "maxBudgetCents";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}

export class UpdateVehicleRequestDto {
  @IsOptional()
  @IsIn(["ACKNOWLEDGED", "SOURCING", "MATCH_FOUND", "NO_MATCH", "CANCELLED"])
  status?: "ACKNOWLEDGED" | "SOURCING" | "MATCH_FOUND" | "NO_MATCH" | "CANCELLED";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  matchedListingId?: string;
}
