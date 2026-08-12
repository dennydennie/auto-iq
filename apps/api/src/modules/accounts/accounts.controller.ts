import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type {
  AuthenticatedUser,
  CookieResponse,
  CorrelatedRequest,
} from "../../common/types/http";
import { SessionService } from "../identity/session.service";
import { AccountsService } from "./accounts.service";
import { AccountDeletionService } from "./account-deletion.service";
import { ConsentService } from "./consent.service";
import {
  AccountDeletionRequestDto,
  RecordConsentDto,
  UpdateMeDto,
} from "./dto/accounts.dto";

@Controller("me")
@UseGuards(AuthGuard)
export class AccountsController {
  constructor(
    private readonly accountDeletionService: AccountDeletionService,
    private readonly accountsService: AccountsService,
    private readonly consentService: ConsentService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.me(user.id);
  }

  @Patch()
  @UseGuards(CsrfGuard)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateMeDto) {
    return this.accountsService.updateMe(user.id, body);
  }

  @Post("account-deletion-requests")
  @HttpCode(202)
  @UseGuards(CsrfGuard)
  async requestDeletion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AccountDeletionRequestDto,
    @Req() request: CorrelatedRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const result = await this.accountDeletionService.requestAuthenticated(
      user.id,
      body,
    );
    await this.sessionService.destroy(request, response);
    return result;
  }

  @Post("consents")
  @UseGuards(CsrfGuard)
  recordConsent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RecordConsentDto,
  ) {
    return this.consentService.record(user.id, body);
  }
}
