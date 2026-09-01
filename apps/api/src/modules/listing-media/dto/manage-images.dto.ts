import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsUUID,
} from "class-validator";

export class UpdateImageDto {
  @Equals(true)
  isCover!: true;
}

export class ReorderImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  imageIds!: string[];
}
