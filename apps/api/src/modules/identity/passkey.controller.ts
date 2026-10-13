import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser, CookieResponse, CorrelatedRequest } from "../../common/types/http";
import { RateLimitService } from "./rate-limit.service";
import { VerifyPasskeyDto } from "./dto/passkey.dto";
import { PasskeyService } from "./passkey.service";
import { SessionService } from "./session.service";
import { ConfigService } from "@nestjs/config";
import { resolveClientIp } from "../../common/security/client-ip";

@Controller("auth/passkeys")
export class PasskeyController {
  constructor(private readonly passkeys: PasskeyService, private readonly sessions: SessionService,
    private readonly limits: RateLimitService, private readonly config: ConfigService) {}

  @Get("config") configInfo() { return this.passkeys.config(); }

  @Post("login/options") @HttpCode(200)
  async loginOptions(@Req() request: CorrelatedRequest) {
    await this.limit(request);
    return this.passkeys.loginOptions();
  }

  @Post("login/verify") @HttpCode(200)
  async login(@Body() dto: VerifyPasskeyDto, @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse) {
    await this.limit(request);
    const result = await this.passkeys.login(dto);
    await this.sessions.create(result.userId, response);
    return result;
  }

  @Post("registration/options") @HttpCode(200) @UseGuards(AuthGuard, CsrfGuard)
  registrationOptions(@CurrentUser() actor: AuthenticatedUser) { return this.passkeys.registrationOptions(actor); }

  @Post("registration/verify") @UseGuards(AuthGuard, CsrfGuard)
  register(@CurrentUser() actor: AuthenticatedUser, @Body() dto: VerifyPasskeyDto) { return this.passkeys.register(actor, dto); }

  @Get() @UseGuards(AuthGuard)
  list(@CurrentUser() actor: AuthenticatedUser) { return this.passkeys.list(actor); }

  @Delete(":id") @UseGuards(AuthGuard, CsrfGuard)
  remove(@CurrentUser() actor: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) { return this.passkeys.remove(actor, id); }

  private limit(request: CorrelatedRequest) {
    return this.limits.consume(`passkey:ip:${resolveClientIp(request, this.config)}`, 30, 60);
  }
}
