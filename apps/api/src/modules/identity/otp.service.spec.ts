import { NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { OtpService } from "./otp.service";

describe("OtpService", () => {
  it("rejects an expired code", async () => {
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("test") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      { get: jest.fn().mockResolvedValue(null) } as never,
      { findByIdentifier: jest.fn().mockResolvedValue({ id: "user-1", phone: "+263771234567" }) } as never,
    );

    await expect(service.verify("+263771234567", "123456")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects unknown phone numbers", async () => {
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("test") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      {} as never,
      { findByIdentifier: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(service.verify("+263771234567", "123456")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("requires both SMS and email delivery when the user has both contacts", async () => {
    const notifyUser = jest.fn().mockResolvedValue([
      { channel: "SMS", status: "SENT" },
      { channel: "EMAIL", status: "FAILED" },
    ]);
    const redis = {
      del: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("staging") } as never,
      { notifyUser } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      redis as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "buyer@example.com",
          phone: "+263771234567",
        }),
      } as never,
    );

    await expect(service.send("+263771234567")).rejects.toBeInstanceOf(ServiceUnavailableException);
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
    expect(redis.del).toHaveBeenCalledWith("otp:+263771234567");
    expect(redis.del).toHaveBeenCalledWith("otp_delivery:+263771234567");
  });

  it("sends OTP to both auth channels when requested by email", async () => {
    const notifyUser = jest.fn().mockResolvedValue([
      { channel: "SMS", status: "SENT" },
      { channel: "EMAIL", status: "SENT" },
    ]);
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("production") } as never,
      { notifyUser } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      { set: jest.fn().mockResolvedValue(undefined) } as never,
      {
        findByIdentifier: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "buyer@example.com",
          phone: "+263771234567",
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
      get: jest.fn().mockResolvedValue(
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

    await expect(service.verify("buyer@example.com", "123456")).resolves.toEqual({
      verified: true,
      userId: "user-1",
    });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ phoneVerified: true, status: "ACTIVE" }),
    );
  });
});
