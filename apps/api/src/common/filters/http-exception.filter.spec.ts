jest.mock("@sentry/nestjs", () => ({
  captureException: jest.fn(),
  withScope: jest.fn((callback: (scope: { setTag: jest.Mock; setUser: jest.Mock }) => void) =>
    callback({ setTag: jest.fn(), setUser: jest.fn() })),
}));

import * as Sentry from "@sentry/nestjs";
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createHost(request: Record<string, unknown> = {}) {
    const json = jest.fn();
    return {
      json,
      host: {
        switchToHttp: () => ({
          getRequest: () => ({ correlationId: "corr-1", originalUrl: "/api/v1/listings", ...request }),
          getResponse: () => ({
            status: (_code: number) => ({ json }),
          }),
        }),
      } as never,
    };
  }

  it("reports unhandled 5xx errors to sentry", () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost({ currentUser: { id: "user-1" } });

    filter.catch(new Error("boom"), host);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: "INTERNAL_ERROR",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      correlationId: "corr-1",
      message: "Internal server error",
    }));
    expect(json).not.toHaveBeenCalledWith(expect.objectContaining({ details: expect.anything() }));
  });

  it.each([
    {
      code: "DELIVERY_UNAVAILABLE",
      message: "We couldn't send your code right now. Please try again shortly.",
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    },
    {
      code: "PRESIGN_FAILED",
      message: "We couldn't prepare your upload right now. Please try again shortly.",
      statusCode: HttpStatus.BAD_GATEWAY,
    },
    {
      code: "STORAGE_INSPECTION_FAILED",
      message: "We couldn't verify your uploaded file right now. Please try again shortly.",
      statusCode: HttpStatus.BAD_GATEWAY,
    },
  ])("returns canonical feedback for $code without provider details", ({ code, message, statusCode }) => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new HttpException({
      code,
      message: "bucket=private-secret provider=credential-value",
      details: ["access-key=secret"],
    }, statusCode), host);

    expect(json).toHaveBeenCalledWith({
      code,
      message,
      correlationId: "corr-1",
      details: undefined,
      statusCode,
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain("private-secret");
    expect(JSON.stringify(json.mock.calls)).not.toContain("access-key");
  });

  it("masks unapproved 5xx response bodies", () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new HttpException({
      code: "UPSTREAM_PROVIDER_FAILED",
      message: "credential=private-secret",
    }, HttpStatus.BAD_GATEWAY), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      statusCode: HttpStatus.BAD_GATEWAY,
    }));
    expect(JSON.stringify(json.mock.calls)).not.toContain("private-secret");
  });

  it("does not report expected 404 exceptions", () => {
    const filter = new HttpExceptionFilter();
    const { host } = createHost();

    filter.catch(new NotFoundException({
      code: "RESOURCE_NOT_FOUND",
      message: "Missing",
    }), host);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("does not report health-route failures to sentry", () => {
    const filter = new HttpExceptionFilter();
    const { host } = createHost({ originalUrl: "/api/v1/health/ready" });

    filter.catch(new HttpException("down", HttpStatus.INTERNAL_SERVER_ERROR), host);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns actionable validation messages instead of the generic 422 label", () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new UnprocessableEntityException({
      code: "VALIDATION_FAILED",
      message: ["property vehiclePurpose should not exist", "budgetMin must not be less than 0"],
    }), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: "VALIDATION_FAILED",
      message: "property vehiclePurpose should not exist; budgetMin must not be less than 0",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }));
  });
});
