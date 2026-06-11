import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { CorrelatedRequest } from "../../common/types/http";

@Injectable()
export class AdminOpsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    if (request.currentUser?.roles.includes("ADMIN")) {
      return true;
    }
    throw new ForbiddenException({
      code: "FORBIDDEN",
      message: "Admin access is required",
    });
  }
}
