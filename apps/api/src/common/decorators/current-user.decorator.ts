import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser, CorrelatedRequest } from "../types/http";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    if (!request.currentUser) {
      throw new Error("CurrentUser decorator used without AuthGuard");
    }
    return request.currentUser;
  },
);
