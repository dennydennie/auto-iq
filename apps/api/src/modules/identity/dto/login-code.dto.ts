import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class RequestLoginCodeDto {
  @IsString() @IsNotEmpty() @MaxLength(254)
  identifier!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @ArrayUnique() @IsIn(["SMS", "EMAIL"], { each: true })
  channels!: Array<"SMS" | "EMAIL">;
}

export class VerifyLoginCodeDto {
  @IsString() @IsNotEmpty() @MaxLength(254)
  identifier!: string;

  @Matches(/^\d{6}$/)
  code!: string;
}
