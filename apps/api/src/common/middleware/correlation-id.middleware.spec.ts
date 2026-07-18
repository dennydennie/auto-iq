import { CorrelationIdMiddleware } from "./correlation-id.middleware";
import type { CorrelatedRequest } from "../types/http";

describe("CorrelationIdMiddleware", () => {
  it("preserves bounded correlation IDs", () => {
    const request = { headers: { "x-correlation-id": "trace-123" } } as CorrelatedRequest;
    const response = { setHeader: jest.fn() };
    const next = jest.fn();

    new CorrelationIdMiddleware().use(request, response, next);

    expect(request.correlationId).toBe("trace-123");
    expect(response.setHeader).toHaveBeenCalledWith("X-Correlation-Id", "trace-123");
    expect(next).toHaveBeenCalled();
  });

  it("replaces oversized and unsafe values", () => {
    const request = { headers: { "x-correlation-id": `${"a".repeat(129)}\nforged` } } as CorrelatedRequest;
    const response = { setHeader: jest.fn() };

    new CorrelationIdMiddleware().use(request, response, jest.fn());

    expect(request.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
