import { IsNotEmptyObject, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class VerifyPasskeyDto {
  @IsUUID()
  challengeId!: string;

  @IsObject()
  @IsNotEmptyObject()
  response!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;
}
