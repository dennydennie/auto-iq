import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { resolveClientIp } from "../../common/security/client-ip";
import type { CookieResponse, CorrelatedRequest } from "../../common/types/http";
import { RequestLoginCodeDto, VerifyLoginCodeDto } from "./dto/login-code.dto";
import { LoginCodeService } from "./login-code.service";
import { RateLimitService } from "./rate-limit.service";
import { SessionService } from "./session.service";

@Controller("auth/login-code")
export class LoginCodeController {
  constructor(private readonly codes: LoginCodeService, private readonly sessions: SessionService,
    private readonly limits: RateLimitService, private readonly config: ConfigService) {}

  @Post("request") @HttpCode(200)
  async requestCode(@Body() dto: RequestLoginCodeDto, @Req() request: CorrelatedRequest) {
    await this.limit(request);
    return this.codes.request(dto);
  }

  @Post("verify") @HttpCode(200)
  async verify(@Body() dto: VerifyLoginCodeDto, @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse) {
    await this.limit(request);
    const result = await this.codes.verify(dto);
    await this.sessions.create(result.userId, response);
    return result;
  }

  private limit(request: CorrelatedRequest) {
    return this.limits.consume(`login-code:ip:${resolveClientIp(request, this.config)}`, 30, 900);
  }
}
