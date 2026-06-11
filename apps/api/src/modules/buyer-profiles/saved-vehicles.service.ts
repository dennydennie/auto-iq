import { Injectable, NotFoundException } from "@nestjs/common";
import { InspectionReportRepository } from "../../db/repository/inspection-report.repository";
import { SavedVehicleRepository } from "../../db/repository/saved-vehicle.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { StorageService } from "../storage/storage.service";
import { SavedVehiclesQueryDto } from "./dto/saved-vehicles.dto";

@Injectable()
export class SavedVehiclesService {
  constructor(
    private readonly inspectionReportRepository: InspectionReportRepository,
    private readonly savedVehicleRepository: SavedVehicleRepository,
    private readonly storageService: StorageService,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async list(userId: string, query: SavedVehiclesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.savedVehicleRepository.findPageForBuyer(userId, page, limit);

    return {
      data: await Promise.all(rows.map((row) => this.toDto(row))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async save(userId: string, listingId: string) {
    const existing = await this.savedVehicleRepository.findByBuyerAndListing(userId, listingId);
    if (existing) {
      return this.toDto(existing);
    }

    const listing = await this.vehicleRepository.findPublicBySlugOrId(listingId);
    if (!listing || listing.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }

    const saved = await this.savedVehicleRepository.save(this.savedVehicleRepository.create({
      buyerUserId: userId,
      listingId: listing.id,
    }));
    const hydrated = await this.savedVehicleRepository.findByBuyerAndListing(userId, listing.id);
    return this.toDto(hydrated ?? saved);
  }

  async remove(userId: string, listingId: string) {
    await this.savedVehicleRepository.deleteByBuyerAndListing(userId, listingId);
  }

  private async toDto(saved: {
    id: string;
    listing?: {
      id: string;
      slug: string;
      specs: { year: number; make: string; model: string; bodyType: string };
      pricing: { askPriceUsd: string; negotiable: boolean };
      images?: { storageKey: string; isCover: boolean }[];
      seller?: { city: string };
      publishedAt?: Date | null;
      sellerUserId?: string;
    };
    createdAt: Date;
  }) {
    const cover = saved.listing?.images?.find((image) => image.isCover) ?? saved.listing?.images?.[0] ?? null;
    const publishedAt = saved.listing?.publishedAt ?? saved.createdAt;
    const report = saved.listing?.id
      ? await this.inspectionReportRepository.findByListingId(saved.listing.id)
      : null;
    const approvedReport = report?.buyerSummaryApproved ? report : null;

    return {
      id: saved.id,
      listing: {
        id: saved.listing?.id ?? "",
        slug: saved.listing?.slug ?? "",
        year: saved.listing?.specs.year ?? 0,
        make: saved.listing?.specs.make ?? "",
        model: saved.listing?.specs.model ?? "",
        bodyType: saved.listing?.specs.bodyType ?? "SUV",
        askPriceUsd: Number(saved.listing?.pricing.askPriceUsd ?? 0),
        negotiable: saved.listing?.pricing.negotiable ?? false,
        city: saved.listing?.seller?.city ?? "",
        coverImageUrl: cover ? await this.storageService.getDisplayUrl(cover.storageKey) : null,
        bisellVerified: Boolean(approvedReport),
        inspectionScore: approvedReport?.overallScore ?? null,
        daysListed: Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000)),
      },
      savedAt: saved.createdAt.toISOString(),
    };
  }
}
