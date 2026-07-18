import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RateLimitService } from "../../modules/identity/rate-limit.service";
import { resolveClientIp } from "../security/client-ip";
import type { CorrelatedRequest } from "../types/http";

const HEALTH_PREFIX = "/api/v1/health/";
const AUTH_PREFIXES = [
  "/api/v1/auth/",
  "/api/v1/identity/",
  "/api/v1/password",
  "/api/v1/otp",
];

@Injectable()
export class GlobalRateLimitGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const path = request.originalUrl ?? request.url ?? "";
    if (path.startsWith(HEALTH_PREFIX)) {
      return true;
    }

    const policy = this.policyFor(request.method ?? "GET", path);
    const ip = resolveClientIp(request, this.config);
    await this.rateLimitService.consume(
      `${policy.name}:${ip}`,
      policy.limit,
      policy.windowSeconds,
    );
    return true;
  }

  private policyFor(method: string, path: string) {
    const windowSeconds = this.config.get<number>("GLOBAL_RATE_LIMIT_WINDOW_SECONDS", 60);
    if (AUTH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return { name: "auth", limit: 20, windowSeconds };
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      return { name: "mutation", limit: 60, windowSeconds };
    }
    return {
      name: "global",
      limit: this.config.get<number>("GLOBAL_RATE_LIMIT_MAX", 120),
      windowSeconds,
    };
  }
}
