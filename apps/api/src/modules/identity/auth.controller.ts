import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type {
  CookieResponse,
  CorrelatedRequest,
} from "../../common/types/http";
import { AuthService } from "./auth.service";
import { CsrfService } from "./csrf.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from "./dto/auth.dto";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Get("csrf")
  csrf(
    @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    return this.csrfService.issue(
      this.sessionService.sessionFromRequest(request),
      response,
    );
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.authService.login(
      body,
      resolveClientIp(request, this.config),
    );
    await this.sessionService.create(result.userId, response);
    return result;
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(AuthGuard, CsrfGuard)
  async logout(
    @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    await this.sessionService.destroy(request, response);
  }

  @Post("otp/send")
  @HttpCode(200)
  sendOtp(@Body() body: SendOtpDto) {
    return this.otpService.send(otpIdentifier(body));
  }

  @Post("otp/verify")
  @HttpCode(200)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.otpService.verify(otpIdentifier(body), body.code);
    await this.sessionService.create(result.userId, response);
    return { verified: true };
  }

  @Post("forgot-password")
  @HttpCode(204)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body);
  }

  @Post("reset-password")
  @HttpCode(204)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body);
  }
}

function resolveClientIp(request: CorrelatedRequest, config: ConfigService) {
  const clientIp = header(request, "x-auto-iq-client-ip");
  const signature = header(request, "x-auto-iq-bff-signature");
  const secret = config.get<string>("BFF_SHARED_SECRET");
  if (!clientIp || !isIP(clientIp) || !signature || !secret) {
    return request.ip ?? "unknown";
  }
  const expected = createHmac("sha256", secret).update(clientIp).digest("hex");
  return signaturesMatch(signature, expected)
    ? clientIp
    : (request.ip ?? "unknown");
}

function header(request: CorrelatedRequest, name: string) {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function signaturesMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}

function otpIdentifier(body: SendOtpDto | VerifyOtpDto) {
  const identifier = body.identifier ?? body.phone;
  if (!identifier) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "An email or phone number is required.",
    });
  }

  return identifier;
}
