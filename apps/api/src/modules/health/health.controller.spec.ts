import { HealthController } from "./health.controller";
import { type ReadinessResponse } from "./health.service";

describe("HealthController", () => {
  it("returns the readiness payload without mutating the response when healthy", async () => {
    const response = { status: jest.fn() };
    const payload: ReadinessResponse = {
      status: "ok",
      checks: { db: "up", redis: "up", storage: "up" },
    };
    const controller = new HealthController({
      getLive: jest.fn(),
      getReady: jest.fn().mockResolvedValue(payload),
    } as never);

    await expect(controller.getReady(response)).resolves.toEqual(payload);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("sets a 503 response code when a dependency is unavailable", async () => {
    const response = { status: jest.fn() };
    const payload: ReadinessResponse = {
      status: "error",
      checks: { db: "up", redis: "down", storage: "up" },
    };
    const controller = new HealthController({
      getLive: jest.fn(),
      getReady: jest.fn().mockResolvedValue(payload),
    } as never);

    await expect(controller.getReady(response)).resolves.toEqual(payload);
    expect(response.status).toHaveBeenCalledWith(503);
  });
});
