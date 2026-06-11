import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser, CorrelatedRequest } from "../../common/types/http";
import { InspectionTaskListQueryDto, SubmitInspectionReportDto } from "./dto/inspections.dto";
import { InspectionsService } from "./inspections.service";

@Controller("inspectors/inspection-tasks")
@UseGuards(AuthGuard, RolesGuard)
@Roles("INSPECTOR")
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: InspectionTaskListQueryDto) {
    return this.inspectionsService.listInspectorTasks(
      user.id,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(":taskId")
  detail(@CurrentUser() user: AuthenticatedUser, @Param("taskId") taskId: string) {
    return this.inspectionsService.getInspectorTaskDetail(user.id, taskId);
  }

  @Post(":taskId/report")
  @UseGuards(CsrfGuard)
  submitReport(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("taskId") taskId: string,
    @Body() body: SubmitInspectionReportDto,
  ) {
    return this.inspectionsService.submitReport(user.id, request.correlationId, taskId, body);
  }
}
