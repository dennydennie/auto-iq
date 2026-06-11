import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/types/http";
import {
  CreateListingDto,
  SellerListingsQueryDto,
  SubmitListingDto,
  UpsertListingDisclosureDto,
  UpsertListingPricingDto,
  UpsertListingSpecsDto,
} from "./dto/listings.dto";
import { ListingsService } from "./listings.service";

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles("SELLER")
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get("me/listings")
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: SellerListingsQueryDto) {
    return this.listingsService.list(user.id, query);
  }

  @Post("listings")
  @UseGuards(CsrfGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateListingDto) {
    return this.listingsService.create(user.id, body);
  }

  @Patch("listings/:listingId")
  @UseGuards(CsrfGuard)
  updateDisclosure(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: UpsertListingDisclosureDto,
  ) {
    return this.listingsService.updateDisclosure(user.id, listingId, body);
  }

  @Put("listings/:listingId/specs")
  @UseGuards(CsrfGuard)
  upsertSpecs(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: UpsertListingSpecsDto,
  ) {
    return this.listingsService.upsertSpecs(user.id, listingId, body);
  }

  @Put("listings/:listingId/pricing")
  @UseGuards(CsrfGuard)
  upsertPricing(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: UpsertListingPricingDto,
  ) {
    return this.listingsService.upsertPricing(user.id, listingId, body);
  }

  @Post("listings/:listingId/submit")
  @UseGuards(CsrfGuard)
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listingId") listingId: string,
    @Body() body: SubmitListingDto,
  ) {
    return this.listingsService.submit(user.id, listingId, body);
  }

  @Get("listings/:listingId/timeline")
  timeline(@CurrentUser() user: AuthenticatedUser, @Param("listingId") listingId: string) {
    return this.listingsService.timeline(user.id, listingId);
  }
}
