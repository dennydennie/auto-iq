import { createHmac } from "node:crypto";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  it("creates a session and omits the user id after OTP verification", async () => {
    const otpService = {
      verify: jest.fn().mockResolvedValue({ userId: "user-1" }),
    };
    const sessionService = {
      create: jest.fn().mockResolvedValue("session-1"),
    };
    const controller = new AuthController(
      {} as never,
      {} as never,
      otpService as never,
      sessionService as never,
      { get: jest.fn() } as never,
    );
    const response = { cookie: jest.fn() };

    await expect(
      controller.verifyOtp(
        { identifier: "buyer@example.com", code: "123456" },
        response as never,
      ),
    ).resolves.toEqual({ verified: true });
    expect(sessionService.create).toHaveBeenCalledWith("user-1", response);
  });

  it("passes the client IP into login throttling", async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({ userId: "user-1" }),
    };
    const sessionService = { create: jest.fn().mockResolvedValue("session-1") };
    const controller = new AuthController(
      authService as never,
      {} as never,
      {} as never,
      sessionService as never,
      { get: jest.fn() } as never,
    );
    const response = { cookie: jest.fn() };

    await controller.login(
      { identifier: "buyer@example.com", password: "password-123" },
      { headers: {}, ip: "203.0.113.10" },
      response as never,
    );

    expect(authService.login).toHaveBeenCalledWith(
      { identifier: "buyer@example.com", password: "password-123" },
      "203.0.113.10",
    );
  });

  it("accepts a client IP only when the BFF signature is valid", async () => {
    const secret = "test-bff-shared-secret";
    const clientIp = "198.51.100.24";
    const signature = createHmac("sha256", secret)
      .update(clientIp)
      .digest("hex");
    const authService = {
      login: jest.fn().mockResolvedValue({ userId: "user-1" }),
    };
    const controller = new AuthController(
      authService as never,
      {} as never,
      {} as never,
      { create: jest.fn() } as never,
      { get: jest.fn().mockReturnValue(secret) } as never,
    );

    await controller.login(
      { identifier: "buyer@example.com", password: "password-123" },
      {
        headers: {
          "x-auto-iq-client-ip": clientIp,
          "x-auto-iq-bff-signature": signature,
        },
        ip: "10.0.0.8",
      },
      { cookie: jest.fn() } as never,
    );

    expect(authService.login).toHaveBeenCalledWith(
      expect.any(Object),
      clientIp,
    );
  });
});
