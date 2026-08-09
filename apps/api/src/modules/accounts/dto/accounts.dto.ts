import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  Matches,
} from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  preferredBodyTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  preferredMakes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  businessName?: string | null;
}

export class RecordConsentDto {
  @IsIn(["TERMS", "PRIVACY", "SELLER_RULES", "BUYER_RULES", "NO_SIDE_DEAL"])
  consentType!: "TERMS" | "PRIVACY" | "SELLER_RULES" | "BUYER_RULES" | "NO_SIDE_DEAL";

  @Matches(/^\d+\.\d+\.\d+$/)
  version!: string;

  @IsBoolean()
  accepted!: true;
}
