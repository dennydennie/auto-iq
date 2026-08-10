import { QuotesService } from "./quotes.service";

describe("QuotesService", () => {
  it("creates a trimmed NEW quote for a published listing", async () => {
    const dependencies = quoteDependencies();
    const service = new QuotesService(
      dependencies.audit as never,
      dependencies.quotes as never,
      dependencies.rateLimit as never,
      dependencies.vehicles as never,
    );

    const result = await service.create("buyer-1", "correlation-1", "listing-1", {
      offerPriceUsd: 20_500,
      paymentPlan: "BANK_TRANSFER",
      message: "  Ready this week.  ",
    });

    expect(result).toMatchObject({
      listingId: "listing-1",
      buyerId: "buyer-1",
      offerPriceUsd: 20_500,
      message: "Ready this week.",
      status: "NEW",
    });
    expect(dependencies.rateLimit.consume).toHaveBeenCalledWith(
      "quote:buyer-1",
      10,
      3600,
    );
    expect(dependencies.listing.quoteCount).toBe(1);
  });

  it("rejects a quote against the buyer's own listing", async () => {
    const dependencies = quoteDependencies({ sellerUserId: "buyer-1" });
    const service = new QuotesService(
      dependencies.audit as never,
      dependencies.quotes as never,
      dependencies.rateLimit as never,
      dependencies.vehicles as never,
    );

    await expect(
      service.create("buyer-1", undefined, "listing-1", {
        offerPriceUsd: 20_500,
        paymentPlan: "FULL_CASH",
      }),
    ).rejects.toThrow("Sellers cannot request quotes on their own listings");
    expect(dependencies.quotes.save).not.toHaveBeenCalled();
  });

  it("allows NEW to UNDER_REVIEW to ACCEPTED", () => {
    const service = new QuotesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(service.transition("NEW", "UNDER_REVIEW")).toBe("UNDER_REVIEW");
    expect(service.transition("UNDER_REVIEW", "ACCEPTED")).toBe("ACCEPTED");
  });

  it("requires a valid quote transition", () => {
    const service = new QuotesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(() => service.transition("ACCEPTED", "UNDER_REVIEW")).toThrow(
      "Cannot move quote from ACCEPTED to UNDER_REVIEW",
    );
  });
});

function quoteDependencies(overrides?: { sellerUserId?: string }) {
  const timestamp = new Date("2026-08-10T08:00:00.000Z");
  const listing = {
    id: "listing-1",
    status: "PUBLISHED",
    sellerUserId: overrides?.sellerUserId ?? "seller-1",
    quoteCount: 0,
    pricing: { askPriceUsd: "22000.00" },
  };
  const quotes = {
    create: jest.fn((data) => ({
      ...data,
      id: "quote-1",
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    save: jest.fn(async (quote) => quote),
    findByIdWithRelations: jest.fn(async () => null),
  };
  return {
    audit: { record: jest.fn() },
    listing,
    quotes,
    rateLimit: { consume: jest.fn() },
    vehicles: {
      findPublicBySlugOrId: jest.fn(async () => listing),
      findAdminById: jest.fn(async () => listing),
      save: jest.fn(async (vehicle) => vehicle),
    },
  };
}
