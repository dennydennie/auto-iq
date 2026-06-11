import { ForbiddenException } from "@nestjs/common";
import { CsrfGuard } from "./csrf.guard";

describe("CsrfGuard", () => {
  function context(request: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never;
  }

  it("uses the configured CSRF header name", async () => {
    const guard = new CsrfGuard(
      { verify: jest.fn().mockResolvedValue(true) } as never,
      { get: jest.fn(() => "x-auto-csrf") } as never,
    );

    await expect(guard.canActivate(context({
      method: "POST",
      currentUser: { sessionId: "session-1" },
      headers: { "x-auto-csrf": "token-1" },
    }))).resolves.toBe(true);
  });

  it("rejects unsafe requests without a valid CSRF token", async () => {
    const guard = new CsrfGuard(
      { verify: jest.fn().mockResolvedValue(false) } as never,
      { get: jest.fn(() => "x-csrf-token") } as never,
    );

    await expect(guard.canActivate(context({
      method: "POST",
      currentUser: { sessionId: "session-1" },
      headers: { "x-csrf-token": "bad-token" },
    }))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
