import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
import {
  PAYMENT_PLANS,
  QUOTE_STATUSES,
} from "../../../common/constants/listing.constants";

export class CreateQuoteDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  offerPriceUsd!: number;

  @IsIn(PAYMENT_PLANS)
  paymentPlan!: (typeof PAYMENT_PLANS)[number];

  @IsOptional()
  @IsString()
  message?: string;
}

export class QuoteListQueryDto {
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
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsIn(QUOTE_STATUSES)
  status?: (typeof QUOTE_STATUSES)[number];

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "offerPriceUsd"])
  sortBy?: "createdAt" | "updatedAt" | "offerPriceUsd";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortDir?: "ASC" | "DESC";
}

export class UpdateQuoteDto {
  @IsIn(["UNDER_REVIEW", "ACCEPTED", "COUNTERED", "DECLINED"])
  status!: "UNDER_REVIEW" | "ACCEPTED" | "COUNTERED" | "DECLINED";

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  counterPriceUsd?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  responseNote?: string;
}
