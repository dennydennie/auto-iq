import * as Sentry from "@sentry/nestjs";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { CorrelatedRequest } from "../types/http";

interface ApiErrorEnvelope {
  code: string;
  message: string;
  correlationId: string;
  details?: FieldError[];
  statusCode: number;
}

interface FieldError {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<CorrelatedRequest>();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const statusCode = getStatusCode(exception);
    const route = request.originalUrl ?? request.url ?? request.route?.path ?? "";

    if (shouldReportException(exception, statusCode, route)) {
      Sentry.withScope((scope) => {
        scope.setTag("correlationId", request.correlationId ?? "");
        scope.setTag("route", route);
        if (request.currentUser) {
          scope.setUser({ id: request.currentUser.id });
        }
        Sentry.captureException(exception instanceof Error ? exception : new Error(getErrorMessage(exception)));
      });
    }

    response.status(statusCode).json({
      code: getErrorCode(exception, statusCode),
      message: getErrorMessage(exception),
      correlationId: request.correlationId ?? "",
      details: getDetails(exception),
      statusCode,
    } satisfies ApiErrorEnvelope);
  }
}

function shouldReportException(exception: unknown, statusCode: number, route: string): boolean {
  if (route.startsWith("/api/v1/health/")) {
    return false;
  }
  if (exception instanceof HttpException && statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
    return false;
  }
  return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
}

function getStatusCode(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function getErrorCode(exception: unknown, statusCode: number): string {
  const body = getExceptionBody(exception);
  if (isRecord(body) && typeof body.code === "string") {
    return body.code;
  }
  return statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? "INTERNAL_ERROR" : "HTTP_ERROR";
}

function getErrorMessage(exception: unknown): string {
  const body = getExceptionBody(exception);
  if (isRecord(body) && typeof body.message === "string") {
    return body.message;
  }
  if (exception instanceof Error) {
    return exception.message;
  }
  return "Internal server error";
}

function getDetails(exception: unknown): FieldError[] | undefined {
  const body = getExceptionBody(exception);
  if (!isRecord(body) || !Array.isArray(body.message)) {
    return undefined;
  }
  return body.message.map((message) => ({ field: "request", message: String(message) }));
}

function getExceptionBody(exception: unknown): unknown {
  if (exception instanceof HttpException) {
    return exception.getResponse();
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
