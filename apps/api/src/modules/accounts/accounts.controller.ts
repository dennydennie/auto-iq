import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { AccountsService } from "./accounts.service";
import { ConsentService } from "./consent.service";
import { RecordConsentDto, UpdateMeDto } from "./dto/accounts.dto";

@Controller("me")
@UseGuards(AuthGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly consentService: ConsentService,
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

  @Post("seller-profile")
  @UseGuards(CsrfGuard)
  activateSeller(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.activateSeller(user.id);
  }

  @Post("consents")
  @UseGuards(CsrfGuard)
  recordConsent(@CurrentUser() user: AuthenticatedUser, @Body() body: RecordConsentDto) {
    return this.consentService.record(user.id, body);
  }
}
