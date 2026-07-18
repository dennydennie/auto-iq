import { IsIn, IsInt, IsString, Max, MaxLength, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DOCUMENT_TYPES } from "../../../common/constants/listing.constants";

export class RegisterDocumentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  storageKey!: string;

  @ApiProperty({ enum: ["application/pdf", "image/jpeg", "image/png"] })
  @IsIn(["application/pdf", "image/jpeg", "image/png"])
  contentType!: "application/pdf" | "image/jpeg" | "image/png";

  @ApiProperty({ minimum: 1, maximum: 15 * 1024 * 1024 })
  @IsInt()
  @Min(1)
  @Max(15 * 1024 * 1024)
  contentLength!: number;

  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];
}
