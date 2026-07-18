import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { SellerListingAccessService } from "../listings/seller-listing-access.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { DocumentPresignDto, ImagePresignDto, PresignUploadResponseDto } from "./dto/storage.dto";
import { StorageService } from "./storage.service";

@Controller("storage")
@ApiTags("Storage")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles("SELLER")
export class StorageController {
  constructor(
    private readonly accessService: SellerListingAccessService,
    private readonly storageService: StorageService,
  ) {}

  @Post("images/presign")
  @ApiCreatedResponse({ type: PresignUploadResponseDto })
  async presignImage(@CurrentUser() user: AuthenticatedUser, @Body() body: ImagePresignDto) {
    await this.accessService.getOwnedEditableListing(user.id, body.listingId);
    return this.storageService.presignImage(user.id, body.listingId, body.slot, body.contentType, body.contentLength);
  }

  @Post("documents/presign")
  @ApiCreatedResponse({ type: PresignUploadResponseDto })
  async presignDocument(@CurrentUser() user: AuthenticatedUser, @Body() body: DocumentPresignDto) {
    await this.accessService.getOwnedEditableListing(user.id, body.listingId);
    return this.storageService.presignDocument(user.id, body.listingId, body.documentType, body.contentType, body.contentLength);
  }
}
