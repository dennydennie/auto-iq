import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
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
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  make!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model!: string;

  @IsInt()
  @Min(1950)
  @Max(2100)
  year!: number;

  @IsIn(BODY_TYPES)
  bodyType!: (typeof BODY_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  colour!: string;

  @IsIn(FUEL_TYPES)
  fuelType!: (typeof FUEL_TYPES)[number];

  @IsIn(TRANSMISSION_TYPES)
  transmission!: (typeof TRANSMISSION_TYPES)[number];

  @IsIn(DRIVE_TYPES)
  driveType!: (typeof DRIVE_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(40)
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
  @MaxLength(2000)
  accidentNote?: string;
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
  @MaxLength(4000)
  sellerDisclosure!: string;
}

export class UpsertListingDisclosureDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
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
