import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IMAGE_SLOTS } from "../../../common/constants/listing.constants";

export class RegisterImageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  storageKey!: string;

  @ApiProperty({ enum: ["image/jpeg", "image/png", "image/webp"] })
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  contentType!: "image/jpeg" | "image/png" | "image/webp";

  @ApiProperty({ minimum: 1, maximum: 10 * 1024 * 1024 })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  contentLength!: number;

  @ApiProperty({ enum: IMAGE_SLOTS })
  @IsIn(IMAGE_SLOTS)
  slot!: (typeof IMAGE_SLOTS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
