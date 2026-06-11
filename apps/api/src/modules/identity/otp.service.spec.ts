import { NotFoundException, UnauthorizedException } from "@nestjs/common";
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
});
