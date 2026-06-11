import { Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import { SavedVehiclesQueryDto } from "./dto/saved-vehicles.dto";
import { SavedVehiclesService } from "./saved-vehicles.service";

@Controller("me/saved-vehicles")
@UseGuards(AuthGuard, RolesGuard)
@Roles("BUYER")
export class SavedVehiclesController {
  constructor(private readonly savedVehiclesService: SavedVehiclesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: SavedVehiclesQueryDto) {
    return this.savedVehiclesService.list(user.id, query);
  }

  @Post(":listingId")
  @UseGuards(CsrfGuard)
  save(@CurrentUser() user: AuthenticatedUser, @Param("listingId") listingId: string) {
    return this.savedVehiclesService.save(user.id, listingId);
  }

  @Delete(":listingId")
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("listingId") listingId: string) {
    await this.savedVehiclesService.remove(user.id, listingId);
  }
}
