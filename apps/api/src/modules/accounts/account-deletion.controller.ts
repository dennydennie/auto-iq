import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CorrelatedRequest } from "../../common/types/http";
import { resolveClientIp } from "../../common/security/client-ip";
import { AccountDeletionService } from "./account-deletion.service";
import { PublicAccountDeletionRequestDto } from "./dto/accounts.dto";

@Controller("account-deletion-requests")
export class AccountDeletionController {
  constructor(
    private readonly accountDeletionService: AccountDeletionService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(202)
  requestDeletion(
    @Body() body: PublicAccountDeletionRequestDto,
    @Req() request: CorrelatedRequest,
  ) {
    return this.accountDeletionService.requestPublic(
      body,
      resolveClientIp(request, this.config),
    );
  }
}
