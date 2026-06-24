import { SessionService } from "./session.service";

describe("SessionService", () => {
  function createService(userStatus: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED") {
    return new SessionService(
      {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === "SESSION_COOKIE_NAME") {
            return "auto_iq_session";
          }
          if (key === "SESSION_SECRET") {
            return "test-secret";
          }
          return undefined;
        }),
        getOrThrow: jest.fn().mockImplementation((key: string) => {
          if (key === "SESSION_COOKIE_NAME") {
            return "auto_iq_session";
          }
          if (key === "SESSION_SECRET") {
            return "test-secret";
          }
          throw new Error(`Unexpected key ${key}`);
        }),
      } as never,
      {
        get: jest.fn().mockResolvedValue("user-1"),
        set: jest.fn(),
        del: jest.fn(),
      } as never,
      {
        findProfileById: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "buyer@example.com",
          status: userStatus,
          roles: [{ role: "BUYER" }],
        }),
      } as never,
    );
  }

  it("rejects sessions for pending-verification users", async () => {
    const service = createService("PENDING_VERIFICATION");

    const result = await service.authenticateRequest({
      cookies: { auto_iq_session: "session-1" },
    } as never);

    expect(result).toBeNull();
  });

  it("returns the authenticated user for active sessions", async () => {
    const service = createService("ACTIVE");

    const result = await service.authenticateRequest({
      cookies: { auto_iq_session: "session-1" },
    } as never);

    expect(result).toMatchObject({
      id: "user-1",
      email: "buyer@example.com",
      roles: ["BUYER"],
      sessionId: "session-1",
    });
  });
});
