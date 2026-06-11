import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("reports readiness when database and redis are up", async () => {
    const service = new HealthService(
      { query: jest.fn().mockResolvedValue([{ result: 1 }]) } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
    );

    await expect(service.getReady()).resolves.toEqual({
      status: "ok",
      checks: { db: "up", redis: "up", storage: "up" },
    });
  });

  it("reports degraded readiness when redis is down", async () => {
    const service = new HealthService(
      { query: jest.fn().mockResolvedValue([{ result: 1 }]) } as never,
      { ping: jest.fn().mockResolvedValue("down") } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
    );

    await expect(service.getReady()).resolves.toEqual({
      status: "error",
      checks: { db: "up", redis: "down", storage: "up" },
    });
  });

  it("reports degraded readiness when the database is down", async () => {
    const service = new HealthService(
      { query: jest.fn().mockRejectedValue(new Error("db unavailable")) } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
    );

    await expect(service.getReady()).resolves.toEqual({
      status: "error",
      checks: { db: "down", redis: "up", storage: "up" },
    });
  });

  it("reports degraded readiness when storage is down", async () => {
    const service = new HealthService(
      { query: jest.fn().mockResolvedValue([{ result: 1 }]) } as never,
      { ping: jest.fn().mockResolvedValue("up") } as never,
      { ping: jest.fn().mockResolvedValue("down") } as never,
    );

    await expect(service.getReady()).resolves.toEqual({
      status: "error",
      checks: { db: "up", redis: "up", storage: "down" },
    });
  });
});
