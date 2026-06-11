import { IsIn, IsString } from "class-validator";
import { DOCUMENT_TYPES } from "../../../common/constants/listing.constants";

export class RegisterDocumentDto {
  @IsString()
  storageKey!: string;

  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];
}
