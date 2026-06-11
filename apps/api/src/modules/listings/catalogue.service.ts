import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/types/http";
import { InspectionReportRepository } from "../../db/repository/inspection-report.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { ListingsService } from "./listings.service";
import { CatalogueQueryDto } from "./dto/catalogue.dto";
import { CatalogueQueryService } from "./catalogue-query.service";
import { PublicListingMapper } from "./public-listing.mapper";

@Injectable()
export class CatalogueService {
  constructor(
    private readonly catalogueQueryService: CatalogueQueryService,
    private readonly inspectionReportRepository: InspectionReportRepository,
    private readonly listingsService: ListingsService,
    private readonly publicListingMapper: PublicListingMapper,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async list(query: CatalogueQueryDto) {
    const result = await this.catalogueQueryService.list(query);
    return {
      data: await Promise.all(result.rows.map((row) => this.publicListingMapper.toCardDto(row))),
      meta: result.meta,
    };
  }

  async detail(slugOrId: string, user?: AuthenticatedUser) {
    if (user?.roles.includes("SELLER")) {
      const owned = await this.vehicleRepository.findOwnedById(slugOrId, user.id);
      if (owned) {
        return this.listingsService.detail(user.id, slugOrId);
      }
    }

    const listing = await this.vehicleRepository.findPublicBySlugOrId(slugOrId);
    if (!listing || listing.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }

    const report = await this.findApprovedSummary(listing.id);
    await this.vehicleRepository.incrementViewCount(listing.id);
    return this.publicListingMapper.toDetailDto(listing, report, listing.viewCount + 1);
  }

  async inspectionSummary(slugOrId: string) {
    const listing = await this.vehicleRepository.findPublicBySlugOrId(slugOrId);
    if (!listing || listing.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }

    const report = await this.findApprovedSummary(listing.id);
    if (!report) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Inspection summary not found",
      });
    }
    return this.publicListingMapper.toInspectionSummaryDto(listing.id, report);
  }

  private async findApprovedSummary(listingId: string) {
    const report = await this.inspectionReportRepository.findByListingId(listingId);
    if (!report?.buyerSummaryApproved) {
      return null;
    }
    return report;
  }
}
