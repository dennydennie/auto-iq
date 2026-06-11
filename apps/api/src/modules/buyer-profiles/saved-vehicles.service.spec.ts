import { SavedVehiclesService } from "./saved-vehicles.service";

describe("SavedVehiclesService", () => {
  it("returns the existing saved vehicle when the buyer saves the same listing again", async () => {
    const existing = {
      id: "saved-1",
      listing: {
        id: "listing-1",
        status: "PUBLISHED",
        slug: "listing-1",
        specs: { year: 2021, make: "Toyota", model: "Hilux", bodyType: "BAKKIE" },
        pricing: { askPriceUsd: "19500.00", negotiable: false },
        seller: { city: "Harare" },
        images: [],
        publishedAt: new Date("2026-06-01T08:00:00.000Z"),
      },
      createdAt: new Date("2026-06-09T08:00:00.000Z"),
    };
    const repository = {
      findByBuyerAndListing: jest.fn().mockResolvedValue(existing),
      save: jest.fn(),
      create: jest.fn(),
    };
    const service = new SavedVehiclesService(
      { findByListingId: jest.fn().mockResolvedValue(null) } as never,
      repository as never,
      { getDisplayUrl: jest.fn().mockResolvedValue(null) } as never,
      { findPublicBySlugOrId: jest.fn() } as never,
    );

    const saved = await service.save("buyer-1", "listing-1");

    expect(saved.id).toBe("saved-1");
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("is idempotent even if listing status changes after save", async () => {
    const existing = {
      id: "saved-2",
      listing: {
        id: "listing-2",
        status: "INSPECTION_PENDING",
        slug: "listing-2",
        specs: { year: 2019, make: "Mazda", model: "Cx5", bodyType: "SUV" },
        pricing: { askPriceUsd: "9000.00", negotiable: true },
        seller: { city: "Harare" },
        images: [],
        publishedAt: null,
      },
      createdAt: new Date("2026-06-09T09:00:00.000Z"),
    };
    const repository = {
      findByBuyerAndListing: jest.fn().mockResolvedValue(existing),
      save: jest.fn(),
      create: jest.fn(),
    };
    const service = new SavedVehiclesService(
      { findByListingId: jest.fn().mockResolvedValue(null) } as never,
      repository as never,
      { getDisplayUrl: jest.fn().mockResolvedValue(null) } as never,
      { findPublicBySlugOrId: jest.fn() } as never,
    );

    const saved = await service.save("buyer-1", "listing-2");

    expect(saved.id).toBe("saved-2");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
