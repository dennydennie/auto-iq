jest.mock("@sentry/nestjs", () => ({
  captureException: jest.fn(),
  withScope: jest.fn((callback: (scope: { setTag: jest.Mock; setUser: jest.Mock }) => void) =>
    callback({ setTag: jest.fn(), setUser: jest.fn() })),
}));

import * as Sentry from "@sentry/nestjs";
import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";
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

  it("does not expose provider details in 5xx responses", () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(new HttpException({
      code: "PRESIGN_FAILED",
      message: "bucket=private-secret provider=credential-value",
      details: ["access-key=secret"],
    }, HttpStatus.BAD_GATEWAY), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      statusCode: HttpStatus.BAD_GATEWAY,
    }));
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
});
