import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { SessionService } from "../../modules/identity/session.service";
import type { CorrelatedRequest } from "../types/http";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    request.currentUser = await this.sessionService.authenticateRequest(request) ?? undefined;
    return true;
  }
}
