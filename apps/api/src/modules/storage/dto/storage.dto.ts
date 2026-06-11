import { IsIn, IsInt, Min } from "class-validator";
import { DOCUMENT_TYPES, IMAGE_SLOTS } from "../../../common/constants/listing.constants";

export class ImagePresignDto {
  @IsIn(IMAGE_SLOTS)
  slot!: (typeof IMAGE_SLOTS)[number];

  @IsIn(["image/jpeg", "image/png", "image/webp"])
  contentType!: "image/jpeg" | "image/png" | "image/webp";

  @IsInt()
  @Min(1)
  contentLength!: number;
}

export class DocumentPresignDto {
  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];

  @IsIn(["application/pdf", "image/jpeg", "image/png"])
  contentType!: "application/pdf" | "image/jpeg" | "image/png";

  @IsInt()
  @Min(1)
  contentLength!: number;
}
