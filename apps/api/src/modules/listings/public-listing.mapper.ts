import { Injectable } from "@nestjs/common";
import { InspectionFindingEntity } from "../../db/entity/inspection-finding.entity";
import { InspectionReportEntity } from "../../db/entity/inspection-report.entity";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class PublicListingMapper {
  constructor(private readonly storageService: StorageService) {}

  async toCardDto(input: PublicListingCardInput) {
    return {
      id: input.id,
      slug: input.slug,
      year: input.year,
      make: input.make,
      model: input.model,
      bodyType: input.bodyType,
      askPriceUsd: input.askPriceUsd,
      negotiable: input.negotiable,
      city: input.city,
      coverImageUrl: input.coverImageStorageKey
        ? await this.storageService.getDisplayUrl(input.coverImageStorageKey)
        : null,
      bisellVerified: input.inspectionScore !== null,
      inspectionScore: input.inspectionScore,
      daysListed: daysListed(input.publishedAt),
    };
  }

  async toDetailDto(
    listing: VehicleEntity,
    report: InspectionReportEntity | null,
    currentViewCount: number,
  ) {
    const images = [...(listing.images ?? [])].sort((left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime(),
    );

    return {
      id: listing.id,
      slug: listing.slug,
      year: listing.specs.year,
      make: listing.specs.make,
      model: listing.specs.model,
      bodyType: listing.specs.bodyType,
      colour: listing.specs.colour,
      fuelType: listing.specs.fuelType,
      transmission: listing.specs.transmission,
      driveType: listing.specs.driveType,
      engineCapacity: listing.specs.engineCapacity,
      mileageKm: listing.specs.mileageKm,
      askPriceUsd: Number(listing.pricing.askPriceUsd),
      negotiable: listing.pricing.negotiable,
      sellerDisclosure: listing.sellerDisclosure,
      city: listing.seller.city,
      coverImageUrl: await this.coverImageUrl(images),
      images: await Promise.all(images.map(async (image) => ({
        id: image.id,
        slot: image.slot,
        url: await this.storageService.getDisplayUrl(image.storageKey),
        isCover: image.isCover,
        uploadedAt: image.createdAt.toISOString(),
      }))),
      inspectionSummary: report ? this.toInspectionSummaryDto(listing.id, report) : null,
      bisellVerified: Boolean(report),
      publishedAt: listing.publishedAt?.toISOString() ?? new Date().toISOString(),
      daysListed: daysListed(listing.publishedAt),
      viewCount: currentViewCount,
    };
  }

  toInspectionSummaryDto(listingId: string, report: InspectionReportEntity) {
    const findings = buyerVisibleFindings(report.findings ?? []);
    const categories = summarizeCategories(findings);

    return {
      listingId,
      inspectionDate: report.createdAt.toISOString(),
      inspectorName: report.submittedByInspector?.fullName ?? "",
      overallScore: report.overallScore,
      roadworthy: report.roadworthy,
      categories,
      findings: findings.map((finding) => ({
        label: finding.label,
        rating: finding.rating,
        note: finding.note,
      })),
      inspectorNote: report.buyerNote ?? report.inspectorNote,
    };
  }

  private async coverImageUrl(images: VehicleEntity["images"]) {
    const cover = images.find((image) => image.isCover) ?? images[0] ?? null;
    if (!cover) {
      return null;
    }
    return this.storageService.getDisplayUrl(cover.storageKey);
  }
}

export interface PublicListingCardInput {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  bodyType: string;
  askPriceUsd: number;
  negotiable: boolean;
  city: string;
  coverImageStorageKey: string | null;
  inspectionScore: number | null;
  publishedAt: Date;
}

function daysListed(publishedAt: Date | null): number {
  if (!publishedAt) {
    return 0;
  }
  const elapsed = Date.now() - publishedAt.getTime();
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

function buyerVisibleFindings(findings: InspectionFindingEntity[]): InspectionFindingEntity[] {
  const included = findings.filter((finding) => finding.includeInBuyerSummary);
  return included.length > 0 ? included : findings;
}

function summarizeCategories(findings: InspectionFindingEntity[]) {
  const categoryMap = new Map<string, InspectionFindingEntity[]>();
  for (const finding of findings) {
    const entries = categoryMap.get(finding.category) ?? [];
    entries.push(finding);
    categoryMap.set(finding.category, entries);
  }

  return [...categoryMap.entries()].map(([category, entries]) => {
    const counts = { PASS: 0, WATCH: 0, FAIL: 0 };
    let total = 0;
    let worstRating: "PASS" | "WATCH" | "FAIL" = "PASS";
    for (const entry of entries) {
      counts[entry.rating] += 1;
      total += ratingScore(entry.rating);
      if (severity(entry.rating) > severity(worstRating)) {
        worstRating = entry.rating;
      }
    }
    return {
      category,
      score: Math.round(total / entries.length),
      worstRating,
      counts,
    };
  });
}

function ratingScore(rating: "PASS" | "WATCH" | "FAIL") {
  if (rating === "PASS") {
    return 100;
  }
  if (rating === "WATCH") {
    return 60;
  }
  return 20;
}

function severity(rating: "PASS" | "WATCH" | "FAIL") {
  if (rating === "FAIL") {
    return 3;
  }
  if (rating === "WATCH") {
    return 2;
  }
  return 1;
}
