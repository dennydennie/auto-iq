import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type {
  AuthenticatedUser,
  CorrelatedRequest,
} from "../../common/types/http";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import {
  AdminViewingListQueryDto,
  CancelViewingDto,
  CompleteViewingDto,
  ConfirmViewingDto,
  RequestViewingDto,
  RescheduleViewingDto,
  ViewingListQueryDto,
} from "./dto/viewings.dto";
import { ViewingsService } from "./viewings.service";

@Controller()
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post("listings/:listingId/viewings")
  @UseGuards(AuthGuard, RolesGuard, CsrfGuard)
  @Roles("BUYER")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: RequestViewingDto,
  ) {
    return this.viewingsService.requestViewing(
      user.id,
      request.correlationId,
      listingId,
      body,
    );
  }

  @Get("me/viewings")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("BUYER")
  listBuyer(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ViewingListQueryDto,
  ) {
    return this.viewingsService.listBuyer(user.id, query);
  }

  @Get("me/seller-viewings")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("SELLER")
  listSeller(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ViewingListQueryDto,
  ) {
    return this.viewingsService.listSeller(user.id, query);
  }

  @Post("me/viewings/:viewingId/seller-confirm")
  @UseGuards(AuthGuard, RolesGuard, CsrfGuard)
  @Roles("SELLER")
  sellerAcknowledge(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("viewingId") viewingId: string,
  ) {
    return this.viewingsService.sellerAcknowledge(
      user.id,
      request.correlationId,
      viewingId,
    );
  }

  @Get("admin/viewings")
  @UseGuards(AuthGuard, AdminOpsGuard)
  listAdmin(@Query() query: AdminViewingListQueryDto) {
    return this.viewingsService.listAdmin(query);
  }

  @Get("admin/viewings/:viewingId")
  @UseGuards(AuthGuard, AdminOpsGuard)
  detailAdmin(@Param("viewingId") viewingId: string) {
    return this.viewingsService.detail(viewingId);
  }

  @Post("admin/viewings/:viewingId/confirm")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("viewingId") viewingId: string,
    @Body() body: ConfirmViewingDto,
  ) {
    return this.viewingsService.confirm(
      user.id,
      request.correlationId,
      viewingId,
      body,
    );
  }

  @Post("admin/viewings/:viewingId/reschedule")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  reschedule(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("viewingId") viewingId: string,
    @Body() body: RescheduleViewingDto,
  ) {
    return this.viewingsService.reschedule(
      user.id,
      request.correlationId,
      viewingId,
      body,
    );
  }

  @Post("admin/viewings/:viewingId/cancel")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("viewingId") viewingId: string,
    @Body() body: CancelViewingDto,
  ) {
    return this.viewingsService.cancel(
      user.id,
      request.correlationId,
      viewingId,
      body,
    );
  }

  @Post("admin/viewings/:viewingId/complete")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("viewingId") viewingId: string,
    @Body() body: CompleteViewingDto,
  ) {
    return this.viewingsService.complete(
      user.id,
      request.correlationId,
      viewingId,
      body,
    );
  }
}
