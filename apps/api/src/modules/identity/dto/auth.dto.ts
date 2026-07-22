import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\+[1-9]\d{7,14}$/)
  phone!: string;

  @IsString()
  @MaxLength(128)
  @MinLength(8)
  password!: string;

  @IsIn(["BUYER", "SELLER"])
  role!: "BUYER" | "SELLER";

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class SendOtpDto {
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier?: string;

  @Matches(/^\d{6}$/)
  code!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(["WEB", "MOBILE"])
  client?: "WEB" | "MOBILE";
}

export class ResetPasswordDto {
  @ValidateIf((body: ResetPasswordDto) => !body.email && !body.code)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token?: string;

  @ValidateIf((body: ResetPasswordDto) => !body.token)
  @IsEmail()
  email?: string;

  @ValidateIf((body: ResetPasswordDto) => !body.token)
  @Matches(/^\d{6}$/)
  code?: string;

  @IsString()
  @MaxLength(128)
  @MinLength(8)
  newPassword!: string;
}
