import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBodyTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredMakes?: string[];

  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @IsOptional()
  @IsString()
  businessName?: string;
}

export class RecordConsentDto {
  @IsIn(["TERMS", "PRIVACY", "SELLER_RULES", "BUYER_RULES", "NO_SIDE_DEAL"])
  consentType!: "TERMS" | "PRIVACY" | "SELLER_RULES" | "BUYER_RULES" | "NO_SIDE_DEAL";

  @Matches(/^\d+\.\d+\.\d+$/)
  version!: string;

  @IsBoolean()
  accepted!: true;
}
