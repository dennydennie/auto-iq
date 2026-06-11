import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type { AuthenticatedUser, CorrelatedRequest } from "../../common/types/http";
import { InspectionsService } from "../inspections/inspections.service";
import { OwnershipVerificationService } from "../ownership-verification/ownership-verification.service";
import { AdminOpsGuard } from "./admin-ops.guard";
import { AdminOpsService } from "./admin-ops.service";
import {
  AdminListingListQueryDto,
  ApproveBuyerSummaryDto,
  AssignInspectionDto,
  DelistListingDto,
  RejectListingDto,
  RequestChangesDto,
  UpdateOwnershipVerificationDto,
} from "./dto/admin.dto";

@Controller("admin")
@UseGuards(AuthGuard, AdminOpsGuard)
export class AdminOpsController {
  constructor(
    private readonly adminOpsService: AdminOpsService,
    private readonly inspectionsService: InspectionsService,
    private readonly ownershipVerificationService: OwnershipVerificationService,
  ) {}

  @Get("dashboard")
  dashboard() {
    return this.adminOpsService.dashboard();
  }

  @Get("listings")
  list(@Query() query: AdminListingListQueryDto) {
    return this.adminOpsService.list(query);
  }

  @Get("listings/:listingId")
  detail(@Param("listingId") listingId: string) {
    return this.adminOpsService.detail(listingId);
  }

  @Post("listings/:listingId/request-changes")
  @UseGuards(CsrfGuard)
  requestChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: RequestChangesDto,
  ) {
    return this.adminOpsService.requestChanges(user.id, request.correlationId, listingId, body);
  }

  @Post("listings/:listingId/approve")
  @UseGuards(CsrfGuard)
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
  ) {
    return this.adminOpsService.approve(user.id, request.correlationId, listingId);
  }

  @Post("listings/:listingId/publish")
  @UseGuards(CsrfGuard)
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
  ) {
    return this.adminOpsService.publish(user.id, request.correlationId, listingId);
  }

  @Post("listings/:listingId/reject")
  @UseGuards(CsrfGuard)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: RejectListingDto,
  ) {
    return this.adminOpsService.reject(user.id, request.correlationId, listingId, body);
  }

  @Post("listings/:listingId/delist")
  @UseGuards(CsrfGuard)
  delist(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: DelistListingDto,
  ) {
    return this.adminOpsService.delist(user.id, request.correlationId, listingId, body);
  }

  @Post("listings/:listingId/mark-sold")
  @UseGuards(CsrfGuard)
  markSold(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
  ) {
    return this.adminOpsService.markSold(user.id, request.correlationId, listingId);
  }

  @Post("listings/:listingId/mark-reserved")
  @UseGuards(CsrfGuard)
  markReserved(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
  ) {
    return this.adminOpsService.markReserved(user.id, request.correlationId, listingId);
  }

  @Post("listings/:listingId/inspection-tasks")
  @UseGuards(CsrfGuard)
  assignInspection(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: AssignInspectionDto,
  ) {
    return this.inspectionsService.assignTask(user.id, request.correlationId, listingId, body);
  }

  @Post("listings/:listingId/inspection-summary/approve")
  @UseGuards(CsrfGuard)
  approveSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: ApproveBuyerSummaryDto,
  ) {
    return this.inspectionsService.approveBuyerSummary(user.id, request.correlationId, listingId, body);
  }

  @Post("listings/:listingId/ownership-verification")
  @UseGuards(CsrfGuard)
  updateOwnershipVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("listingId") listingId: string,
    @Body() body: UpdateOwnershipVerificationDto,
  ) {
    return this.ownershipVerificationService.updateForListing(
      user.id,
      request.correlationId,
      listingId,
      body,
    );
  }
}
