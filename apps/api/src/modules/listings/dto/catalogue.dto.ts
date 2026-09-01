import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  MinLength,
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

abstract class ValidNumericRangeConstraint implements ValidatorConstraintInterface {
  protected abstract minimum(query: CatalogueQueryDto): number | undefined;
  protected abstract maximum(query: CatalogueQueryDto): number | undefined;

  validate(_: unknown, arguments_: ValidationArguments) {
    const query = arguments_.object as CatalogueQueryDto;
    const minimum = this.minimum(query);
    const maximum = this.maximum(query);
    return minimum === undefined || maximum === undefined || minimum <= maximum;
  }
}

@ValidatorConstraint({ name: "validMileageRange", async: false })
class ValidMileageRangeConstraint extends ValidNumericRangeConstraint {
  protected minimum(query: CatalogueQueryDto) {
    return query.mileageMin;
  }

  protected maximum(query: CatalogueQueryDto) {
    return query.mileageMax;
  }

  defaultMessage() {
    return "Minimum mileage cannot exceed maximum mileage";
  }
}

@ValidatorConstraint({ name: "validPriceRange", async: false })
class ValidPriceRangeConstraint extends ValidNumericRangeConstraint {
  protected minimum(query: CatalogueQueryDto) {
    return query.priceMin;
  }

  protected maximum(query: CatalogueQueryDto) {
    return query.priceMax;
  }

  defaultMessage() {
    return "Minimum price cannot exceed maximum price";
  }
}

@ValidatorConstraint({ name: "validYearRange", async: false })
class ValidYearRangeConstraint extends ValidNumericRangeConstraint {
  protected minimum(query: CatalogueQueryDto) {
    return query.yearMin;
  }

  protected maximum(query: CatalogueQueryDto) {
    return query.yearMax;
  }

  defaultMessage() {
    return "Minimum year cannot exceed maximum year";
  }
}

function toArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
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
  @MinLength(2)
  @MaxLength(120)
  query?: string;

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
  @Max(2100)
  yearMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @Validate(ValidYearRangeConstraint)
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
  @Validate(ValidPriceRangeConstraint)
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
  sortBy?:
    | "publishedAt"
    | "askPriceUsd"
    | "mileageKm"
    | "year"
    | "inspectionScore";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}
