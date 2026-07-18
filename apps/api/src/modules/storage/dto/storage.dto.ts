import { IsIn, IsInt, Min } from "class-validator";
import { DOCUMENT_TYPES, IMAGE_SLOTS } from "../../../common/constants/listing.constants";
import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ImagePresignDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ enum: IMAGE_SLOTS })
  @IsIn(IMAGE_SLOTS)
  slot!: (typeof IMAGE_SLOTS)[number];

  @ApiProperty({ enum: ["image/jpeg", "image/png", "image/webp"] })
  @IsIn(["image/jpeg", "image/png", "image/webp"])
  contentType!: "image/jpeg" | "image/png" | "image/webp";

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  contentLength!: number;
}

export class DocumentPresignDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];

  @ApiProperty({ enum: ["application/pdf", "image/jpeg", "image/png"] })
  @IsIn(["application/pdf", "image/jpeg", "image/png"])
  contentType!: "application/pdf" | "image/jpeg" | "image/png";

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  contentLength!: number;
}

export class PresignUploadResponseDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty({ format: "date-time" })
  expiresAt!: string;
}
