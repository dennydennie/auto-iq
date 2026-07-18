import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Observable, from, switchMap } from "rxjs";
import { TenantContext } from "../../common/tenancy/tenant-context";
import type { CorrelatedRequest } from "../../common/types/http";
import { TenantService } from "./tenant.service";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const userId = request.currentUser?.id;
    const requestedTenantId = headerValue(request.headers["x-tenant-id"]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    const bootstrapTenant = this.config.getOrThrow<string>("DEFAULT_TENANT_ID");
    const resolvedTenant = TenantContext.run(
      { tenantId: bootstrapTenant, userId },
      async () => {
        const tenantId = await this.tenantService.resolve(userId, requestedTenantId);
        await this.tenantService.assertRoles(userId, tenantId, requiredRoles);
        return tenantId;
      },
    );
    return from(resolvedTenant).pipe(
      switchMap((tenantId) => TenantContext.run({ tenantId, userId }, () => next.handle())),
    );
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
