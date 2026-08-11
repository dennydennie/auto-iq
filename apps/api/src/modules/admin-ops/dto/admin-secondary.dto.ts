import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from "class-validator";
import { REFERENCE_OPTION_CATEGORIES } from "../../../db/entity/reference-option.entity";

const ADMIN_USER_ROLES = ["BUYER", "SELLER", "INSPECTOR", "ADMIN"] as const;

export class AdminUserListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(ADMIN_USER_ROLES)
  role?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "SUSPENDED"])
  access?: "ACTIVE" | "SUSPENDED";

  @IsOptional()
  @IsIn(["createdAt", "fullName"])
  sortBy?: "createdAt" | "fullName";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}

export class UpdateAdminUserAccessDto {
  @IsBoolean()
  active!: boolean;
}

export class AdminReportQueryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}

export class AdminViewingLocationListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  active?: boolean;
}

export class CreateAdminViewingLocationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number | null;
}

export class UpdateAdminViewingLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(180)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AdminReferenceOptionListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(REFERENCE_OPTION_CATEGORIES)
  category?: (typeof REFERENCE_OPTION_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  active?: boolean;
}

export class CreateAdminReferenceOptionDto {
  @IsIn(REFERENCE_OPTION_CATEGORIES)
  category!: (typeof REFERENCE_OPTION_CATEGORIES)[number];

  @IsString()
  @Matches(/^[A-Z0-9][A-Z0-9_]{0,79}$/)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateAdminReferenceOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

function parseBoolean(value: unknown) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}
