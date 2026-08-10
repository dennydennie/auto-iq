import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "./accounts.service";

function createFixture() {
  const buyerProfile = {
    id: "buyer-profile-1",
    city: "Harare",
    vehiclePurpose: null,
    searchRadiusKm: null,
    deliveryPreference: null,
    paymentPreference: null,
    preferredBodyTypes: ["SUV"],
    preferredMakes: ["Toyota"],
    preferredFuelTypes: [],
    preferredTransmissions: [],
    minSeats: null,
    maxMileageKm: null,
    yearMin: null,
    yearMax: null,
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
      vehiclePurpose: "FAMILY",
      searchRadiusKm: 120,
      deliveryPreference: "EITHER",
      paymentPreference: "FINANCE",
      preferredFuelTypes: ["DIESEL", "DIESEL", "HYBRID"],
      preferredTransmissions: ["AUTOMATIC"],
      minSeats: 7,
      maxMileageKm: 90000,
      yearMin: 2018,
      yearMax: 2026,
      budgetMin: 2500,
      budgetMax: 30000,
    });

    expect(user.fullName).toBe("New Name");
    expect(user.city).toBe("Bulawayo");
    expect(user.buyerProfile).toMatchObject({
      city: "Bulawayo",
      preferredMakes: ["Toyota", "Honda"],
      preferredBodyTypes: ["SUV"],
      vehiclePurpose: "FAMILY",
      searchRadiusKm: 120,
      deliveryPreference: "EITHER",
      paymentPreference: "FINANCE",
      preferredFuelTypes: ["DIESEL", "HYBRID"],
      preferredTransmissions: ["AUTOMATIC"],
      minSeats: 7,
      maxMileageKm: 90000,
      yearMin: 2018,
      yearMax: 2026,
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
      vehiclePurpose: null,
      searchRadiusKm: null,
      deliveryPreference: null,
      paymentPreference: null,
      preferredFuelTypes: [],
      preferredTransmissions: [],
      minSeats: null,
      maxMileageKm: null,
      yearMin: null,
      yearMax: null,
      budgetMin: null,
      budgetMax: null,
    });

    expect(user.sellerProfile?.businessName).toBeNull();
    expect(user.buyerProfile).toMatchObject({
      preferredMakes: [],
      preferredBodyTypes: [],
      vehiclePurpose: null,
      searchRadiusKm: null,
      deliveryPreference: null,
      paymentPreference: null,
      preferredFuelTypes: [],
      preferredTransmissions: [],
      minSeats: null,
      maxMileageKm: null,
      yearMin: null,
      yearMax: null,
      budgetMin: null,
      budgetMax: null,
    });
  });

  it("rejects invalid numeric ranges before saving", async () => {
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

    const third = createFixture();
    await expect(
      third.service.updateMe("user-1", { yearMin: 2026, yearMax: 2020 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(third.userRepository.save).not.toHaveBeenCalled();

    const fourth = createFixture();
    await expect(
      fourth.service.updateMe("user-1", { searchRadiusKm: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fourth.userRepository.save).not.toHaveBeenCalled();
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
