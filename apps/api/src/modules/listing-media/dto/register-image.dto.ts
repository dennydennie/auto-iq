import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { IMAGE_SLOTS } from "../../../common/constants/listing.constants";

export class RegisterImageDto {
  @IsString()
  storageKey!: string;

  @IsIn(IMAGE_SLOTS)
  slot!: (typeof IMAGE_SLOTS)[number];

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
