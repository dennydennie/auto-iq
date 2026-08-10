import { PublicListingMapper } from "./public-listing.mapper";

describe("PublicListingMapper", () => {
  it("maps detail to the public contract without seller-private fields", async () => {
    const mapper = new PublicListingMapper({ getDisplayUrl: jest.fn() } as never);
    const dto = await mapper.toDetailDto(publicListingFixture(), null, 12);

    expect(Object.keys(dto).sort()).toEqual([
      "askPriceUsd",
      "bisellVerified",
      "bodyType",
      "city",
      "colour",
      "coverImageUrl",
      "daysListed",
      "driveType",
      "engineCapacity",
      "fuelType",
      "id",
      "images",
      "inspectionSummary",
      "make",
      "mileageKm",
      "model",
      "negotiable",
      "publishedAt",
      "sellerDisclosure",
      "slug",
      "transmission",
      "viewCount",
      "year",
    ]);
    expect(dto).not.toHaveProperty("documents");
    expect(dto).not.toHaveProperty("ownershipVerification");
    expect(dto).not.toHaveProperty("sellerUserId");
  });

  it("strips non-allowlisted inspection finding fields", () => {
    const mapper = new PublicListingMapper({ getDisplayUrl: jest.fn() } as never);

    const summary = mapper.toInspectionSummaryDto("listing-1", {
      createdAt: new Date("2026-06-09T08:00:00.000Z"),
      overallScore: 81,
      roadworthy: true,
      inspectorNote: "Inspector note",
      buyerNote: null,
      submittedByInspector: { fullName: "Inspector One" },
      findings: [
        {
          category: "ENGINE",
          label: "Oil level",
          rating: "PASS",
          note: "Healthy",
          photoStorageKey: "private/photo",
          includeInBuyerSummary: true,
        },
      ],
    } as never);

    expect(summary.findings).toEqual([
      { label: "Oil level", rating: "PASS", note: "Healthy" },
    ]);
    expect(summary.findings[0]).not.toHaveProperty("photoStorageKey");
  });
});

function publicListingFixture() {
  return {
    id: "listing-1",
    slug: "2021-toyota-hilux",
    sellerUserId: "seller-1",
    sellerDisclosure: "Known marks disclosed.",
    publishedAt: new Date("2026-08-09T08:00:00.000Z"),
    specs: {
      year: 2021,
      make: "Toyota",
      model: "Hilux",
      bodyType: "BAKKIE",
      colour: "White",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      driveType: "4WD",
      engineCapacity: "2.8L",
      mileageKm: 98_000,
    },
    pricing: { askPriceUsd: "22000.00", negotiable: true },
    seller: { city: "Harare", email: "private@example.test" },
    images: [],
    documents: [{ storageKey: "private/document.pdf" }],
    ownershipVerification: { note: "internal-only" },
  } as never;
}
