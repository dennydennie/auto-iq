import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "../../../common/constants/listing.constants";

function toArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(",")).map((entry) => entry.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return undefined;
}

export class CatalogueQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Transform(({ value }) => toArray(value))
  @IsOptional()
  @IsIn(BODY_TYPES, { each: true })
  bodyType?: string[];

  @Transform(({ value }) => toArray(value))
  @IsOptional()
  @IsString({ each: true })
  make?: string[];

  @IsOptional()
  @IsString()
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

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMax?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  mileageMax?: number;

  @IsOptional()
  @IsIn(TRANSMISSION_TYPES)
  transmission?: (typeof TRANSMISSION_TYPES)[number];

  @IsOptional()
  @IsIn(FUEL_TYPES)
  fuelType?: (typeof FUEL_TYPES)[number];

  @IsOptional()
  @IsString()
  city?: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  bisellVerified?: boolean;

  @IsOptional()
  @IsIn(["publishedAt", "askPriceUsd", "mileageKm", "year", "inspectionScore"])
  sortBy?: "publishedAt" | "askPriceUsd" | "mileageKm" | "year" | "inspectionScore";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}
