import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\+[1-9]\d{7,14}$/)
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(["BUYER", "SELLER"])
  role!: "BUYER" | "SELLER";

  @IsString()
  @IsNotEmpty()
  city!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SendOtpDto {
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identifier?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
