import { PublicListingMapper } from "./public-listing.mapper";

describe("PublicListingMapper", () => {
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
