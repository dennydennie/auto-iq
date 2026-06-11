import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CsrfService } from "../../modules/identity/csrf.service";
import type { CorrelatedRequest } from "../types/http";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly csrfService: CsrfService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    if (SAFE_METHODS.has(request.method ?? "GET")) {
      return true;
    }

    const sessionId = request.currentUser?.sessionId;
    const token = request.headers[this.headerName()];
    const value = Array.isArray(token) ? token[0] : token;
    if (!sessionId || !value || !(await this.csrfService.verify(sessionId, value))) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Invalid CSRF token" });
    }
    return true;
  }

  private headerName(): string {
    return this.configService.get<string>("CSRF_HEADER_NAME", "x-csrf-token").toLowerCase();
  }
}
