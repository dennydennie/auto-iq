import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import type { AuthenticatedUser, CorrelatedRequest } from "../../common/types/http";
import { AdminOpsGuard } from "../admin-ops/admin-ops.guard";
import { NotificationListQueryDto } from "./dto/notifications.dto";
import { NotificationService } from "./notification.service";

@Controller("admin/notifications")
@UseGuards(AuthGuard, AdminOpsGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@Query() query: NotificationListQueryDto) {
    return this.notificationService.list(query);
  }

  @Post(":notificationId/retry")
  @UseGuards(CsrfGuard)
  retry(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: CorrelatedRequest,
    @Param("notificationId") notificationId: string,
  ) {
    return this.notificationService.retry(notificationId, user.id, request.correlationId);
  }
}
