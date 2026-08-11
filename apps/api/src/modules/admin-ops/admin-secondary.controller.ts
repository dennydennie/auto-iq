import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type {
  AuthenticatedUser,
  CorrelatedRequest,
} from "../../common/types/http";
import { AdminOpsGuard } from "./admin-ops.guard";
import { AdminReportsService } from "./admin-reports.service";
import { AdminSettingsService } from "./admin-settings.service";
import { AdminUsersService } from "./admin-users.service";
import {
  AdminReportQueryDto,
  AdminReferenceOptionListQueryDto,
  AdminUserListQueryDto,
  AdminViewingLocationListQueryDto,
  CreateAdminViewingLocationDto,
  CreateAdminReferenceOptionDto,
  UpdateAdminUserAccessDto,
  UpdateAdminViewingLocationDto,
  UpdateAdminReferenceOptionDto,
} from "./dto/admin-secondary.dto";

@Controller("admin")
@UseGuards(AuthGuard, AdminOpsGuard)
export class AdminSecondaryController {
  constructor(
    private readonly reports: AdminReportsService,
    private readonly settings: AdminSettingsService,
    private readonly users: AdminUsersService,
  ) {}

  @Get("users")
  listUsers(@Query() query: AdminUserListQueryDto) {
    return this.users.list(query);
  }

  @Patch("users/:userId/access")
  @UseGuards(CsrfGuard)
  updateUserAccess(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("userId") userId: string,
    @Body() body: UpdateAdminUserAccessDto,
  ) {
    return this.users.updateAccess(
      admin.id,
      request.correlationId,
      userId,
      body,
    );
  }

  @Get("reports/operations")
  operationsReport(@Query() query: AdminReportQueryDto) {
    return this.reports.operations(query);
  }

  @Get("settings/viewing-locations")
  viewingLocations(@Query() query: AdminViewingLocationListQueryDto) {
    return this.settings.listLocations(query);
  }

  @Post("settings/viewing-locations")
  @UseGuards(CsrfGuard)
  createViewingLocation(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Body() body: CreateAdminViewingLocationDto,
  ) {
    return this.settings.createLocation(
      admin.id,
      request.correlationId,
      body,
    );
  }

  @Patch("settings/viewing-locations/:locationId")
  @UseGuards(CsrfGuard)
  updateViewingLocation(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("locationId") locationId: string,
    @Body() body: UpdateAdminViewingLocationDto,
  ) {
    return this.settings.updateLocation(
      admin.id,
      request.correlationId,
      locationId,
      body,
    );
  }

  @Get("settings/reference-options")
  referenceOptions(@Query() query: AdminReferenceOptionListQueryDto) {
    return this.settings.listReferenceOptions(query);
  }

  @Post("settings/reference-options")
  @UseGuards(CsrfGuard)
  createReferenceOption(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Body() body: CreateAdminReferenceOptionDto,
  ) {
    return this.settings.createReferenceOption(admin.id, request.correlationId, body);
  }

  @Patch("settings/reference-options/:optionId")
  @UseGuards(CsrfGuard)
  updateReferenceOption(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("optionId") optionId: string,
    @Body() body: UpdateAdminReferenceOptionDto,
  ) {
    return this.settings.updateReferenceOption(admin.id, request.correlationId, optionId, body);
  }
}
