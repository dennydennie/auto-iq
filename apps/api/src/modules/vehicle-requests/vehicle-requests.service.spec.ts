import { VehicleRequestsService } from "./vehicle-requests.service";

describe("VehicleRequestsService", () => {
  it("creates a trimmed NEW sourcing request", async () => {
    const dependencies = requestDependencies();
    const service = new VehicleRequestsService(
      dependencies.audit as never,
      dependencies.rateLimit as never,
      dependencies.referenceData as never,
      dependencies.vehicles as never,
      dependencies.requests as never,
    );

    const result = await service.create("buyer-1", "correlation-1", {
      maxBudgetCents: 35_000_000,
      makeId: "  toyota  ",
      model: "  Fortuner  ",
      yearMin: 2020,
      yearMax: 2024,
      urgency: "ONE_MONTH",
      notes: "  Seven seats preferred.  ",
    });

    expect(result).toMatchObject({
      buyerId: "buyer-1",
      makeId: "toyota",
      makeName: "Toyota",
      model: "Fortuner",
      status: "NEW",
      notes: "Seven seats preferred.",
    });
    expect(dependencies.rateLimit.consume).toHaveBeenCalledWith(
      "vehicle-request:buyer-1",
      10,
      3600,
    );
  });

  it("scopes buyer request lists to the authenticated buyer", async () => {
    const dependencies = requestDependencies();
    const service = new VehicleRequestsService(
      dependencies.audit as never,
      dependencies.rateLimit as never,
      dependencies.referenceData as never,
      dependencies.vehicles as never,
      dependencies.requests as never,
    );

    await service.listBuyer("buyer-1", { page: 2, limit: 5 });

    expect(dependencies.requests.findBuyerPage).toHaveBeenCalledWith(
      "buyer-1",
      expect.objectContaining({ page: 2, limit: 5 }),
    );
  });

  it("allows NEW vehicle requests to move into sourcing", () => {
    const service = new VehicleRequestsService(
      {} as never,
      {} as never,
      { getAll: jest.fn().mockReturnValue({ makes: [] }) } as never,
      {} as never,
      {} as never,
    );

    expect(service.transition("NEW", "SOURCING")).toBe("SOURCING");
  });
});

function requestDependencies() {
  const timestamp = new Date("2026-08-10T08:00:00.000Z");
  const requests = {
    create: jest.fn((data) => ({
      ...data,
      id: "request-1",
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    save: jest.fn(async (request) => request),
    findByIdWithBuyer: jest.fn(async () => null),
    findBuyerPage: jest.fn(async () => [[], 0]),
  };
  return {
    audit: { record: jest.fn() },
    rateLimit: { consume: jest.fn() },
    referenceData: {
      getMakes: jest.fn().mockResolvedValue([{ id: "toyota", name: "Toyota" }]),
      assertActive: jest.fn(),
    },
    vehicles: {},
    requests,
  };
}
