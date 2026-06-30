import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";
import {
  BODY_TYPES,
  CONDITION_GRADES,
  DRIVE_TYPES,
  FUEL_TYPES,
  LISTING_STATUSES,
  TRANSMISSION_TYPES,
} from "../../../common/constants/listing.constants";

export class UpsertListingSpecsDto {
  @IsOptional()
  @IsUUID()
  makeId?: string;

  @IsString()
  @MinLength(1)
  make!: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsInt()
  @Min(1950)
  @Max(2100)
  year!: number;

  @IsIn(BODY_TYPES)
  bodyType!: (typeof BODY_TYPES)[number];

  @IsString()
  @MinLength(1)
  colour!: string;

  @IsIn(FUEL_TYPES)
  fuelType!: (typeof FUEL_TYPES)[number];

  @IsIn(TRANSMISSION_TYPES)
  transmission!: (typeof TRANSMISSION_TYPES)[number];

  @IsIn(DRIVE_TYPES)
  driveType!: (typeof DRIVE_TYPES)[number];

  @IsOptional()
  @IsString()
  engineCapacity?: string;

  @IsInt()
  @Min(0)
  mileageKm!: number;

  @IsIn(CONDITION_GRADES)
  condition!: (typeof CONDITION_GRADES)[number];

  @IsBoolean()
  hasAccidentHistory!: boolean;

  @IsOptional()
  @IsString()
  accidentNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLongitude?: number;
}

export class UpsertListingPricingDto {
  @IsNumber()
  @Min(0.01)
  askPriceUsd!: number;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;
}

export class CreateListingDto extends UpsertListingSpecsDto {
  @IsNumber()
  @Min(0.01)
  askPriceUsd!: number;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;
}

export class SubmitListingDto {
  @IsString()
  @MinLength(1)
  sellerDisclosure!: string;
}

export class UpsertListingDisclosureDto {
  @IsString()
  @MinLength(1)
  sellerDisclosure!: string;
}

export class SellerListingsQueryDto {
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
  @IsIn(["createdAt", "updatedAt", "askPriceUsd"])
  sortBy?: "createdAt" | "updatedAt" | "askPriceUsd";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}
