import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "./accounts.service";

function createFixture() {
  const buyerProfile = buyerProfileFixture();
  const sellerProfile = sellerProfileFixture();
  const user = userFixture(buyerProfile, sellerProfile);
  const userRepository = repository(user);
  const buyerRepository = repository(buyerProfile);
  const sellerRepository = repository(sellerProfile);
  const service = new AccountsService(
    buyerRepository as never,
    sellerRepository as never,
    userRepository as never,
  );
  return { service, user, userRepository, buyerRepository, sellerRepository };
}

describe("AccountsService", () => {
  it("updates and normalizes the complete mobile buyer profile", async () => {
    const fixture = createFixture();

    await fixture.service.updateMe("user-1", completeUpdate());

    expect(fixture.user.fullName).toBe("New Name");
    expect(fixture.user.city).toBe("Bulawayo");
    expect(fixture.user.buyerProfile).toMatchObject(expectedBuyerUpdate());
    expect(fixture.user.sellerProfile.city).toBe("Bulawayo");
    expect(fixture.buyerRepository.save).toHaveBeenCalled();
    expect(fixture.sellerRepository.save).toHaveBeenCalled();
  });

  it("updates seller details and clears nullable values", async () => {
    const { service, user } = createFixture();

    await service.updateMe("user-1", clearUpdate());

    expect(user.sellerProfile.businessName).toBeNull();
    expect(user.buyerProfile).toMatchObject(expectedClearedBuyer());
  });

  it.each([
    [{ budgetMin: 30000, budgetMax: 20000 }],
    [{ budgetMin: -1 }],
    [{ yearMin: 2026, yearMax: 2020 }],
    [{ searchRadiusKm: 0 }],
  ])("rejects invalid numeric values before saving", async (update) => {
    const { service, userRepository } = createFixture();

    await expect(service.updateMe("user-1", update)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("returns not found when the account is missing", async () => {
    const { service, userRepository } = createFixture();
    userRepository.findProfileById.mockResolvedValue(null);

    await expect(service.me("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.updateMe("missing", { city: "Harare" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function repository(value: unknown) {
  return {
    findProfileById: jest.fn().mockResolvedValue(value),
    save: jest.fn().mockImplementation(async (record) => record),
  };
}

function buyerProfileFixture() {
  return {
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
}

function sellerProfileFixture() {
  return {
    id: "seller-profile-1",
    city: "Harare",
    businessName: "Auto IQ Motors",
    consentsComplete: true,
    verified: true,
  };
}

function userFixture(
  buyerProfile: ReturnType<typeof buyerProfileFixture>,
  sellerProfile: ReturnType<typeof sellerProfileFixture>,
) {
  return {
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
}

function completeUpdate() {
  return {
    fullName: "  New Name  ",
    city: "  Bulawayo ",
    preferredMakes: [" Toyota ", "toyota", " Honda ", ""],
    preferredBodyTypes: [" SUV ", "suv"],
    vehiclePurpose: "FAMILY" as const,
    searchRadiusKm: 120,
    deliveryPreference: "EITHER" as const,
    paymentPreference: "FINANCE" as const,
    preferredFuelTypes: ["DIESEL", "DIESEL", "HYBRID"],
    preferredTransmissions: ["AUTOMATIC"],
    minSeats: 7,
    maxMileageKm: 90000,
    yearMin: 2018,
    yearMax: 2026,
    budgetMin: 2500,
    budgetMax: 30000,
  };
}

function expectedBuyerUpdate() {
  return {
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
  };
}

function clearUpdate() {
  return {
    businessName: null,
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
  };
}

function expectedClearedBuyer() {
  return {
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
  };
}
