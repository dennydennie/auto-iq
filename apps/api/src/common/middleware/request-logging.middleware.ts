import { JsonLogger } from "../logging/json.logger";
import type { CorrelatedRequest } from "../types/http";

interface LoggingResponse {
  on(event: "finish", listener: () => void): void;
  getHeader(name: string): number | string | string[] | undefined;
  statusCode?: number;
}

const logger = new JsonLogger();

export class RequestLoggingMiddleware {
  use(request: CorrelatedRequest, response: LoggingResponse, next: () => void) {
    const startedAt = Date.now();

    response.on("finish", () => {
      logger.log({
        message: "request.completed",
        correlationId: request.correlationId ?? "",
        userId: request.currentUser?.id ?? null,
        method: request.method ?? "UNKNOWN",
        route: routeFor(request),
        statusCode: response.statusCode ?? numberHeader(response.getHeader("status")) ?? 0,
        durationMs: Date.now() - startedAt,
      }, "HttpRequest");
    });

    next();
  }
}

function routeFor(request: CorrelatedRequest): string {
  return request.originalUrl ?? request.url ?? request.route?.path ?? "";
}

function numberHeader(value: number | string | string[] | undefined): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
