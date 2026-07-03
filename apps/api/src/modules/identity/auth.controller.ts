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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type { AuthenticatedUser, CookieResponse, CorrelatedRequest } from "../../common/types/http";
import { AuthService } from "./auth.service";
import { CsrfService } from "./csrf.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
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
  ) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Get("csrf")
  csrf(@Req() request: CorrelatedRequest, @Res({ passthrough: true }) response: CookieResponse) {
    return this.csrfService.issue(this.sessionService.sessionFromRequest(request), response);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.authService.login(body);
    await this.sessionService.create(result.userId, response);
    return result;
  }

  @Post("refresh")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async refresh(
    @Body() _body: RefreshDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    await this.sessionService.refresh(user.sessionId, response);
    return {};
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(AuthGuard, CsrfGuard)
  async logout(@Req() request: CorrelatedRequest, @Res({ passthrough: true }) response: CookieResponse) {
    await this.sessionService.destroy(request, response);
  }

  @Post("otp/send")
  @HttpCode(200)
  sendOtp(@Body() body: SendOtpDto) {
    return this.otpService.send(otpIdentifier(body));
  }

  @Post("otp/verify")
  @HttpCode(200)
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.otpService.verify(otpIdentifier(body), body.code);
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
