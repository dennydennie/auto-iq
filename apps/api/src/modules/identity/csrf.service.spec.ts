import { CsrfService } from "./csrf.service";

describe("CsrfService", () => {
  it("issues and verifies a session-bound token", async () => {
    const store = new Map<string, string>();
    const service = new CsrfService(
      {
        getOrThrow: jest.fn((key: string) => {
          if (key === "CSRF_COOKIE_NAME") {
            return "auto_iq_csrf";
          }
          return "x-csrf-token";
        }),
      } as never,
      {
        get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
        setIfAbsent: jest.fn((key: string, value: string) => {
          if (store.has(key)) return Promise.resolve(false);
          store.set(key, value);
          return Promise.resolve(true);
        }),
      } as never,
      {
        cookieOptions: () => ({ path: "/", sameSite: "lax", secure: false }),
        sign: (value: string) => `signed-${value}`,
      } as never,
    );

    const response = { cookie: jest.fn() };
    const issued = await service.issue("session-1", response as never);

    await expect(service.verify("session-1", issued.token)).resolves.toBe(true);
    await expect(service.verify("session-1", "bad")).resolves.toBe(false);
  });

  it("reuses one token across concurrent session requests", async () => {
    const store = new Map<string, string>();
    const redis = {
      get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setIfAbsent: jest.fn(async (key: string, value: string) => {
        if (store.has(key)) return false;
        store.set(key, value);
        return true;
      }),
    };
    const service = new CsrfService(
      { getOrThrow: jest.fn().mockReturnValue("auto_iq_csrf") } as never,
      redis as never,
      {
        cookieOptions: () => ({ path: "/" }),
        sign: (value: string) => `signed-${value}`,
      } as never,
    );

    const [first, second] = await Promise.all([
      service.issue("session-1", { cookie: jest.fn() } as never),
      service.issue("session-1", { cookie: jest.fn() } as never),
    ]);

    expect(first.token).toBe(second.token);
  });
});
