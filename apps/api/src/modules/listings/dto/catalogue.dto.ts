import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "validMileageRange", async: false })
class ValidMileageRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, arguments_: ValidationArguments) {
    const query = arguments_.object as CatalogueQueryDto;
    return (
      query.mileageMin === undefined ||
      query.mileageMax === undefined ||
      query.mileageMin <= query.mileageMax
    );
  }

  defaultMessage() {
    return "Minimum mileage cannot exceed maximum mileage";
  }
}

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
  @MaxLength(256)
  cursor?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Transform(({ value }) => toArray(value))
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  bodyType?: string[];

  @Transform(({ value }) => toArray(value))
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  make?: string[];

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
  mileageMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Validate(ValidMileageRangeConstraint)
  mileageMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  transmission?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  fuelType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
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
