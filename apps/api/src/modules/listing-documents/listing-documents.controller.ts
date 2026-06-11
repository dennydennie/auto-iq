import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { RegisterDocumentDto } from "./dto/register-document.dto";
import { ListingDocumentsService } from "./listing-documents.service";

@Controller("listings/:listingId/documents")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles("SELLER")
export class ListingDocumentsController {
  constructor(private readonly listingDocumentsService: ListingDocumentsService) {}

  @Post()
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: RegisterDocumentDto,
  ) {
    return this.listingDocumentsService.register(user.id, listingId, body);
  }
}
