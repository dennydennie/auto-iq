import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser, CorrelatedRequest } from "../../common/types/http";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import { CreateQuoteDto, QuoteListQueryDto, UpdateQuoteDto } from "./dto/quotes.dto";
import { QuotesService } from "./quotes.service";

@Controller()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post("listings/:listingId/quotes")
  @UseGuards(AuthGuard, RolesGuard, CsrfGuard)
  @Roles("BUYER")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: CreateQuoteDto,
  ) {
    return this.quotesService.create(user.id, request.correlationId, listingId, body);
  }

  @Get("me/quotes")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("BUYER")
  listBuyer(@CurrentUser() user: AuthenticatedUser, @Query() query: QuoteListQueryDto) {
    return this.quotesService.listBuyer(user.id, query);
  }

  @Get("admin/quotes")
  @UseGuards(AuthGuard, AdminOpsGuard)
  listAdmin(@Query() query: QuoteListQueryDto) {
    return this.quotesService.listAdmin(query);
  }

  @Patch("admin/quotes/:quoteId")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  updateAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("quoteId") quoteId: string,
    @Body() body: UpdateQuoteDto,
  ) {
    return this.quotesService.updateAdmin(user.id, request.correlationId, quoteId, body);
  }
}
