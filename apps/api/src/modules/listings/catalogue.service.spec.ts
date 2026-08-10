import { NotFoundException } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service";

describe("CatalogueService inspection summaries", () => {
  function createService(approved: boolean) {
    const report = {
      id: "report-1",
      buyerSummaryApproved: approved,
    };
    const publicListingMapper = {
      toDetailDto: jest.fn().mockResolvedValue({ id: "listing-1" }),
      toInspectionSummaryDto: jest.fn().mockReturnValue({ listingId: "listing-1" }),
    };
    const vehicleRepository = {
      findPublicBySlugOrId: jest.fn().mockResolvedValue({
        id: "listing-1",
        status: "PUBLISHED",
        viewCount: 4,
      }),
      incrementViewCount: jest.fn().mockResolvedValue(undefined),
    };
    const service = new CatalogueService(
      {} as never,
      { findByListingId: jest.fn().mockResolvedValue(report) } as never,
      {} as never,
      publicListingMapper as never,
      vehicleRepository as never,
    );

    return { publicListingMapper, report, service };
  }

  it("hides an unapproved inspection report from listing detail", async () => {
    const { publicListingMapper, service } = createService(false);

    await service.detail("vehicle-one");

    expect(publicListingMapper.toDetailDto).toHaveBeenCalledWith(
      expect.objectContaining({ id: "listing-1" }),
      null,
      5,
    );
  });

  it("does not expose an unapproved buyer summary endpoint", async () => {
    const { service } = createService(false);

    await expect(service.inspectionSummary("vehicle-one")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("exposes the admin-approved buyer summary", async () => {
    const { publicListingMapper, report, service } = createService(true);

    await expect(service.inspectionSummary("vehicle-one")).resolves.toEqual({
      listingId: "listing-1",
    });
    expect(publicListingMapper.toInspectionSummaryDto).toHaveBeenCalledWith(
      "listing-1",
      report,
    );
  });
});
