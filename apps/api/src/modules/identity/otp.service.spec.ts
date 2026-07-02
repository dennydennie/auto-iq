import { NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { OtpService } from "./otp.service";

describe("OtpService", () => {
  it("rejects an expired code", async () => {
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("test") } as never,
      { notifyUser: jest.fn() } as never,
      {} as never,
      { get: jest.fn().mockResolvedValue(null) } as never,
      { findByPhone: jest.fn().mockResolvedValue({ id: "user-1" }) } as never,
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
      { findByPhone: jest.fn().mockResolvedValue(null) } as never,
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
        findByPhone: jest.fn().mockResolvedValue({
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
});
