import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { RegisterImageDto } from "./dto/register-image.dto";
import { ReorderImagesDto, UpdateImageDto } from "./dto/manage-images.dto";
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

  @Patch(":imageId")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Param("imageId") imageId: string,
    @Body() body: UpdateImageDto,
  ) {
    return this.listingMediaService.update(user.id, listingId, imageId, body);
  }

  @Put("order")
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: ReorderImagesDto,
  ) {
    return this.listingMediaService.reorder(user.id, listingId, body.imageIds);
  }

  @Delete(":imageId")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.listingMediaService.remove(user.id, listingId, imageId);
  }
}
