import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { SessionService } from "../../modules/identity/session.service";
import type { CorrelatedRequest } from "../types/http";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const user = await this.sessionService.authenticateRequest(request);
    if (!user) {
      throw new UnauthorizedException({
        code: "SESSION_EXPIRED",
        message: "Authentication required",
      });
    }
    request.currentUser = user;
    return true;
  }
}
