import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "./accounts.service";

function createFixture() {
  const buyerProfile = {
    id: "buyer-profile-1",
    city: "Harare",
    preferredBodyTypes: ["SUV"],
    preferredMakes: ["Toyota"],
    budgetMin: "1000.00",
    budgetMax: "20000.00",
  };
  const sellerProfile = {
    id: "seller-profile-1",
    city: "Harare",
    businessName: "Auto IQ Motors",
    consentsComplete: true,
    verified: true,
  };
  const user = {
    id: "user-1",
    fullName: "Original Name",
    email: "buyer@example.com",
    phone: "+263771234567",
    status: "ACTIVE" as const,
    city: "Harare",
    phoneVerified: true,
    emailVerified: true,
    roles: [{ role: "BUYER" as const }, { role: "SELLER" as const }],
    consents: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    buyerProfile,
    sellerProfile,
  };
  const userRepository = {
    findProfileById: jest.fn().mockResolvedValue(user),
    save: jest.fn().mockResolvedValue(user),
  };
  const buyerRepository = { save: jest.fn().mockResolvedValue(buyerProfile) };
  const sellerRepository = { save: jest.fn().mockResolvedValue(sellerProfile) };
  const service = new AccountsService(
    buyerRepository as never,
    sellerRepository as never,
    userRepository as never,
  );
  return { service, user, userRepository, buyerRepository, sellerRepository };
}

describe("AccountsService", () => {
  it("updates profile fields and normalizes buyer preferences", async () => {
    const { service, user, buyerRepository, sellerRepository } = createFixture();

    await service.updateMe("user-1", {
      fullName: "  New Name  ",
      city: "  Bulawayo ",
      preferredMakes: [" Toyota ", "toyota", " Honda ", ""],
      preferredBodyTypes: [" SUV ", "suv"],
      budgetMin: 2500,
      budgetMax: 30000,
    });

    expect(user.fullName).toBe("New Name");
    expect(user.city).toBe("Bulawayo");
    expect(user.buyerProfile).toMatchObject({
      city: "Bulawayo",
      preferredMakes: ["Toyota", "Honda"],
      preferredBodyTypes: ["SUV"],
      budgetMin: "2500.00",
      budgetMax: "30000.00",
    });
    expect(user.sellerProfile?.city).toBe("Bulawayo");
    expect(buyerRepository.save).toHaveBeenCalled();
    expect(sellerRepository.save).toHaveBeenCalled();
  });

  it("updates seller details and clears nullable values", async () => {
    const { service, user } = createFixture();

    await service.updateMe("user-1", {
      businessName: "   ",
      preferredMakes: [],
      preferredBodyTypes: [],
      budgetMin: null,
      budgetMax: null,
    });

    expect(user.sellerProfile?.businessName).toBeNull();
    expect(user.buyerProfile).toMatchObject({
      preferredMakes: [],
      preferredBodyTypes: [],
      budgetMin: null,
      budgetMax: null,
    });
  });

  it("rejects negative and inverted budget ranges before saving", async () => {
    const first = createFixture();
    await expect(
      first.service.updateMe("user-1", { budgetMin: 30000, budgetMax: 20000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(first.userRepository.save).not.toHaveBeenCalled();

    const second = createFixture();
    await expect(second.service.updateMe("user-1", { budgetMin: -1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(second.userRepository.save).not.toHaveBeenCalled();
  });

  it("returns a not-found error when the account is missing", async () => {
    const { service, userRepository } = createFixture();
    userRepository.findProfileById.mockResolvedValue(null);

    await expect(service.me("missing-user")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.updateMe("missing-user", { city: "Harare" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
