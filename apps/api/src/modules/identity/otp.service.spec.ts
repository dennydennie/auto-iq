import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { OtpService } from "./otp.service";

describe("OtpService", () => {
  it("uses the generic invalid response for expired codes", async () => {
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("test") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      { get: jest.fn().mockResolvedValue(null) } as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          id: "user-1",
          phone: "+263771234567",
          status: "PENDING_VERIFICATION",
        }),
      } as never,
    );

    const error = await service
      .verify("+263771234567", "123456")
      .catch((value) => value);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getResponse()).toEqual({
      code: "OTP_INVALID",
      message: "Invalid OTP",
    });
  });

  it("uses the same invalid-code response for unknown accounts", async () => {
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("test") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      {} as never,
      { findByIdentifier: jest.fn().mockResolvedValue(null) } as never,
    );

    const error = await service
      .verify("+263771234567", "123456")
      .catch((value) => value);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.getResponse()).toEqual({
      code: "OTP_INVALID",
      message: "Invalid OTP",
    });
  });

  it("invalidates the code after five failed verification attempts", async () => {
    const redisService = {
      del: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue("stored-hash"),
      increment: jest.fn().mockResolvedValue(5),
    };
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("production") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      redisService as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          phone: "+263771234567",
          status: "PENDING_VERIFICATION",
        }),
      } as never,
    );

    const error = await service
      .verify("buyer@example.com", "123456")
      .catch((value) => value);

    expect(redisService.increment).toHaveBeenCalledWith(
      "otp_attempts:+263771234567",
      300,
    );
    expect(redisService.del).toHaveBeenCalledWith("otp:+263771234567");
    expect(error.getResponse()).toEqual({
      code: "OTP_MAX_ATTEMPTS",
      message: "Too many attempts. Request a new code.",
    });
  });

  it("requires at least one successful auth delivery when sending OTP", async () => {
    const notifyUser = jest
      .fn()
      .mockResolvedValue([{ status: "FAILED" }, { status: "FAILED" }]);
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("staging") } as never,
      { notifyUser } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      {
        del: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "buyer@example.com",
          phone: "+263771234567",
          status: "PENDING_VERIFICATION",
        }),
      } as never,
    );

    await expect(service.send("+263771234567")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        channels: ["SMS", "EMAIL"],
        payload: expect.objectContaining({
          code: expect.any(String),
          expiresIn: 300,
          phone: "+263771234567",
        }),
      }),
    );
  });

  it("sends OTP to both auth channels when requested by email", async () => {
    const notifyUser = jest
      .fn()
      .mockResolvedValue([{ status: "SENT" }, { status: "SENT" }]);
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("production") } as never,
      { notifyUser } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      {
        del: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "buyer@example.com",
          phone: "+263771234567",
          status: "PENDING_VERIFICATION",
        }),
      } as never,
    );

    await service.send("buyer@example.com");

    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        phone: "+263771234567",
        channels: ["SMS", "EMAIL"],
      }),
    );
  });

  it("verifies OTP when the caller supplies email instead of phone", async () => {
    const userRepository = {
      findByIdentifier: jest.fn().mockResolvedValue({
        id: "user-1",
        status: "PENDING_VERIFICATION",
        phone: "+263771234567",
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const redisService = {
      del: jest.fn().mockResolvedValue(undefined),
      get: jest
        .fn()
        .mockResolvedValue(
          "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        ),
    };
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("production") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      redisService as never,
      userRepository as never,
    );

    await expect(
      service.verify("buyer@example.com", "123456"),
    ).resolves.toEqual({
      userId: "user-1",
    });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ phoneVerified: true, status: "ACTIVE" }),
    );
    expect(redisService.del).toHaveBeenCalledWith("otp_attempts:+263771234567");
  });

  it("does not reactivate or create an OTP for a suspended user", async () => {
    const redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    const userRepository = {
      findByIdentifier: jest.fn().mockResolvedValue({
        id: "user-1",
        phone: "+263771234567",
        status: "SUSPENDED",
      }),
      save: jest.fn(),
    };
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("production") } as never,
      { notifyUser: jest.fn() } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      redisService as never,
      userRepository as never,
    );

    await expect(service.send("buyer@example.com")).resolves.toEqual({
      expiresIn: 300,
      attemptsRemaining: 2,
    });
    const error = await service
      .verify("buyer@example.com", "123456")
      .catch((value) => value);

    expect(error.getResponse()).toEqual({
      code: "OTP_INVALID",
      message: "Invalid OTP",
    });
    expect(redisService.get).not.toHaveBeenCalled();
    expect(redisService.set).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
