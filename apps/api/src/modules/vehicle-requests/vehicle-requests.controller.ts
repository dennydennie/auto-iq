import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards, Param } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser, CorrelatedRequest } from "../../common/types/http";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import {
  CreateVehicleRequestDto,
  UpdateVehicleRequestDto,
  VehicleRequestListQueryDto,
} from "./dto/vehicle-requests.dto";
import { VehicleRequestsService } from "./vehicle-requests.service";

@Controller()
export class VehicleRequestsController {
  constructor(private readonly vehicleRequestsService: VehicleRequestsService) {}

  @Post("vehicle-requests")
  @UseGuards(AuthGuard, RolesGuard, CsrfGuard)
  @Roles("BUYER")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Body() body: CreateVehicleRequestDto,
  ) {
    return this.vehicleRequestsService.create(user.id, request.correlationId, body);
  }

  @Get("me/vehicle-requests")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("BUYER")
  listBuyer(@CurrentUser() user: AuthenticatedUser, @Query() query: VehicleRequestListQueryDto) {
    return this.vehicleRequestsService.listBuyer(user.id, query);
  }

  @Get("admin/vehicle-requests")
  @UseGuards(AuthGuard, AdminOpsGuard)
  listAdmin(@Query() query: VehicleRequestListQueryDto) {
    return this.vehicleRequestsService.listAdmin(query);
  }

  @Patch("admin/vehicle-requests/:requestId")
  @UseGuards(AuthGuard, AdminOpsGuard, CsrfGuard)
  updateAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("requestId") requestId: string,
    @Body() body: UpdateVehicleRequestDto,
  ) {
    return this.vehicleRequestsService.updateAdmin(user.id, request.correlationId, requestId, body);
  }
}
