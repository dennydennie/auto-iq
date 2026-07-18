import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { RegisterImageDto } from "./dto/register-image.dto";
import { ListingMediaService } from "./listing-media.service";

@Controller("listings/:listingId/images")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles("SELLER")
export class ListingMediaController {
  constructor(private readonly listingMediaService: ListingMediaService) {}

  @Post()
  @ApiBody({ type: RegisterImageDto })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: RegisterImageDto,
  ) {
    return this.listingMediaService.register(user.id, listingId, body);
  }
}
