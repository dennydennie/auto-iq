import { BadRequestException } from "@nestjs/common";
import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes and verifies a strong password", async () => {
    const hash = await service.hash("Strong123");

    expect(hash).not.toBe("Strong123");
    await expect(service.verify("Strong123", hash)).resolves.toBe(true);
    await expect(service.verify("Wrong123", hash)).resolves.toBe(false);
  });

  it("rejects weak passwords", async () => {
    await expect(service.hash("weakpass")).rejects.toBeInstanceOf(BadRequestException);
  });
});
