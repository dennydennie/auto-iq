import { GlobalRateLimitGuard } from "./global-rate-limit.guard";

describe("GlobalRateLimitGuard", () => {
  function context(request: Record<string, unknown>) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
  }

  it("uses the configured global IP policy", async () => {
    const consume = jest.fn().mockResolvedValue(119);
    const guard = new GlobalRateLimitGuard(
      { get: jest.fn((key: string, fallback: number) => key === "GLOBAL_RATE_LIMIT_MAX" ? 120 : fallback) } as never,
      { consume } as never,
    );

    await expect(guard.canActivate(context({ method: "GET", originalUrl: "/api/v1/listings", ip: "203.0.113.8" }))).resolves.toBe(true);
    expect(consume).toHaveBeenCalledWith("global:203.0.113.8", 120, 60);
  });

  it("uses a stricter policy for authentication routes", async () => {
    const consume = jest.fn().mockResolvedValue(1);
    const guard = new GlobalRateLimitGuard(
      { get: jest.fn((_key: string, fallback: number) => fallback) } as never,
      { consume } as never,
    );

    await guard.canActivate(context({ method: "POST", originalUrl: "/api/v1/auth/login", ip: "203.0.113.8" }));
    expect(consume).toHaveBeenCalledWith("auth:203.0.113.8", 20, 60);
  });

  it("does not throttle health checks", async () => {
    const consume = jest.fn();
    const guard = new GlobalRateLimitGuard({ get: jest.fn() } as never, { consume } as never);

    await expect(guard.canActivate(context({ method: "GET", originalUrl: "/api/v1/health/ready", ip: "203.0.113.8" }))).resolves.toBe(true);
    expect(consume).not.toHaveBeenCalled();
  });

  it("uses the signed browser IP forwarded by the BFF", async () => {
    const consume = jest.fn().mockResolvedValue(1);
    const guard = new GlobalRateLimitGuard(
      {
        get: jest.fn((key: string, fallback: number) => key === "BFF_SHARED_SECRET" ? "shared-secret" : fallback),
      } as never,
      { consume } as never,
    );
    const clientIp = "198.51.100.7";
    const { createHmac } = await import("node:crypto");
    const signature = createHmac("sha256", "shared-secret").update(clientIp).digest("hex");

    await guard.canActivate(context({
      method: "GET",
      originalUrl: "/api/v1/listings",
      ip: "10.0.0.4",
      headers: { "x-auto-iq-client-ip": clientIp, "x-auto-iq-bff-signature": signature },
    }));

    expect(consume).toHaveBeenCalledWith("global:198.51.100.7", 120, 60);
  });
});
