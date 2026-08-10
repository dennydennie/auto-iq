import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from "class-validator";
import {
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "../../../common/constants/listing.constants";

const VEHICLE_PURPOSES = [
  "PERSONAL",
  "FAMILY",
  "BUSINESS",
  "RIDE_HAILING",
  "DELIVERY",
  "OTHER",
] as const;
const DELIVERY_PREFERENCES = ["PICKUP", "DELIVERY", "EITHER"] as const;
const PAYMENT_PREFERENCES = ["CASH", "FINANCE", "EITHER"] as const;

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
  @IsIn(VEHICLE_PURPOSES)
  vehiclePurpose?: (typeof VEHICLE_PURPOSES)[number] | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  searchRadiusKm?: number | null;

  @IsOptional()
  @IsIn(DELIVERY_PREFERENCES)
  deliveryPreference?: (typeof DELIVERY_PREFERENCES)[number] | null;

  @IsOptional()
  @IsIn(PAYMENT_PREFERENCES)
  paymentPreference?: (typeof PAYMENT_PREFERENCES)[number] | null;

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
  @IsArray()
  @IsIn(FUEL_TYPES, { each: true })
  preferredFuelTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(TRANSMISSION_TYPES, { each: true })
  preferredTransmissions?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  minSeats?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  maxMileageKm?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1886)
  @Max(2200)
  yearMin?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1886)
  @Max(2200)
  yearMax?: number | null;

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
