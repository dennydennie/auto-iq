import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  function createService(overrides?: {
    configGet?: (key: string, defaultValue?: string) => string | undefined;
    notifyUser?: jest.Mock;
    findByEmail?: jest.Mock;
    findByIdentifier?: jest.Mock;
    verifyPassword?: jest.Mock;
  }) {
    const auditLogRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest
        .fn()
        .mockImplementation(
          (key: string, defaultValue?: string) =>
            overrides?.configGet?.(key, defaultValue) ?? defaultValue,
        ),
    };
    const dataSource = { transaction: jest.fn() };
    const passwordService = {
      hash: jest.fn(),
      verify: overrides?.verifyPassword ?? jest.fn().mockResolvedValue(true),
    };
    const rateLimitService = { consume: jest.fn().mockResolvedValue(1) };
    const redisService = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const userRepository = {
      findByEmail: overrides?.findByEmail ?? jest.fn().mockResolvedValue(null),
      findByIdentifier:
        overrides?.findByIdentifier ?? jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      save: jest.fn(),
    };
    const notificationService = {
      notifyUser:
        overrides?.notifyUser ??
        jest.fn().mockResolvedValue([{ status: "SENT" }]),
    };

    return {
      service: new AuthService(
        auditLogRepository as never,
        config as never,
        dataSource as never,
        passwordService as never,
        rateLimitService as never,
        redisService as never,
        userRepository as never,
        notificationService as never,
      ),
      auditLogRepository,
      config,
      notificationService,
      passwordService,
      rateLimitService,
      redisService,
      userRepository,
    };
  }

  it("blocks pending-verification users from logging in", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
      passwordHash: "hash",
      status: "PENDING_VERIFICATION",
      roles: [{ role: "BUYER" }],
    };
    const { service } = createService({
      findByIdentifier: jest.fn().mockResolvedValue(user),
    });

    const error = await service
      .login(
        { identifier: user.email, password: "password-123" },
        "203.0.113.10",
      )
      .catch((value) => value);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getResponse()).toMatchObject({
      code: "OTP_REQUIRED",
      message: "Verify your phone number before signing in.",
      details: [{ field: "phone", value: "+263••••1111" }],
    });
  });

  it("limits login by identifier and client IP without making identifier lockout trivial", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
      passwordHash: "hash",
      status: "ACTIVE",
      roles: [{ role: "BUYER" }],
    };
    const { service, rateLimitService } = createService({
      findByIdentifier: jest.fn().mockResolvedValue(user),
    });

    await service.login(
      { identifier: " Buyer@Example.com ", password: "password-123" },
      "203.0.113.10",
    );
    await service.login(
      { identifier: " Buyer@Example.com ", password: "password-123" },
      "198.51.100.24",
    );

    expect(rateLimitService.consume).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^login-client:[a-f0-9]{64}$/),
      5,
      900,
    );
    expect(rateLimitService.consume.mock.calls[0]?.[0]).not.toBe(
      rateLimitService.consume.mock.calls[2]?.[0],
    );
    expect(rateLimitService.consume).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^login-account:[a-f0-9]{64}$/),
      25,
      900,
    );
  });

  it("sends password reset notifications with a reset link", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
    };
    const notifyUser = jest.fn().mockResolvedValue([{ status: "SENT" }]);
    const { service, notificationService, redisService } = createService({
      configGet: (key, defaultValue) => {
        if (key === "WEB_BASE_URL") {
          return "https://web.example.com";
        }
        if (key === "NODE_ENV") {
          return "staging";
        }
        return defaultValue;
      },
      findByEmail: jest.fn().mockResolvedValue(user),
      notifyUser,
    });

    await service.forgotPassword({ email: user.email });

    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^reset:/),
      user.id,
      1800,
    );
    const notifyCall = notificationService.notifyUser.mock.calls[0]?.[0];
    const resetUrl = notifyCall?.payload?.resetUrl as string;

    expect(resetUrl).toMatch(
      /^https:\/\/web\.example\.com\/auth\/reset-password#token=/,
    );
    expect(resetUrl).not.toContain("?token=");
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        email: user.email,
        channels: ["EMAIL"],
        template: "PASSWORD_RESET",
        payload: expect.objectContaining({
          expiresInMinutes: 30,
          resetUrl,
        }),
      }),
    );
  });

  it("sends mobile password reset requests to the native app", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
    };
    const { service, notificationService } = createService({
      configGet: (key, defaultValue) => {
        if (key === "MOBILE_RESET_URL") {
          return "autoiq://reset-password";
        }
        if (key === "WEB_BASE_URL") {
          return "https://web.example.com";
        }
        if (key === "NODE_ENV") {
          return "staging";
        }
        return defaultValue;
      },
      findByEmail: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword({ email: user.email, client: "MOBILE" });

    const notifyCall = notificationService.notifyUser.mock.calls[0]?.[0];
    const resetUrl = notifyCall?.payload?.resetUrl as string;

    expect(resetUrl).toMatch(/^autoiq:\/\/reset-password#token=/);
    expect(resetUrl).not.toContain("web.example.com");
    expect(resetUrl).not.toContain("?token=");
  });

  it("falls back to the hosted web origin for password reset links", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
    };
    const { service, notificationService } = createService({
      configGet: (key, defaultValue) => {
        if (key === "NODE_ENV") {
          return "staging";
        }
        return defaultValue;
      },
      findByEmail: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword({ email: user.email });

    const notifyCall = notificationService.notifyUser.mock.calls[0]?.[0];
    const resetUrl = notifyCall?.payload?.resetUrl as string;

    expect(resetUrl).toMatch(
      /^https:\/\/web-staging-1017\.up\.railway\.app\/auth\/reset-password#token=/,
    );
    expect(resetUrl).not.toContain("localhost");
  });

  it("surfaces reset delivery outages for existing accounts", async () => {
    const user = {
      id: "user-1",
      email: "buyer@example.com",
      phone: "+263771111111",
    };
    const { service } = createService({
      configGet: (key, defaultValue) => {
        if (key === "WEB_BASE_URL") {
          return "https://web.example.com";
        }
        if (key === "NODE_ENV") {
          return "staging";
        }
        return defaultValue;
      },
      findByEmail: jest.fn().mockResolvedValue(user),
      notifyUser: jest.fn().mockResolvedValue([{ status: "FAILED" }]),
    });

    await expect(
      service.forgotPassword({ email: user.email }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
