import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CorrelatedRequest, HeaderResponse } from "../types/http";

const HEADER_NAME = "x-correlation-id";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: CorrelatedRequest, response: HeaderResponse, next: () => void) {
    const header = request.headers[HEADER_NAME] ?? request.headers["x-correlation-id"];
    const correlationId = Array.isArray(header) ? header[0] : header;
    request.correlationId = correlationId || randomUUID();
    response.setHeader("X-Correlation-Id", request.correlationId);
    next();
  }
}
