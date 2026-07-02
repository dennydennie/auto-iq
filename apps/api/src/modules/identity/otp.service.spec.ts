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

  it("requires at least one successful auth delivery when sending OTP", async () => {
    const notifyUser = jest.fn().mockResolvedValue([{ status: "FAILED" }, { status: "FAILED" }]);
    const service = new OtpService(
      { get: jest.fn().mockReturnValue("staging") } as never,
      { notifyUser } as never,
      { consume: jest.fn().mockResolvedValue(2) } as never,
      {
        del: jest.fn().mockResolvedValue(undefined),
        set: jest.fn().mockResolvedValue(undefined),
      } as never,
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
  });
});
