import type { BodyType, FuelType, TransmissionType, DriveType } from './enums.js';
import type { VehicleImageDto } from './storage.js';
import type { InspectionFindingRating, InspectionCategory } from './enums.js';
import type { CursorPaginationParams, CursorPaginatedResponse, SortDirection } from './pagination.js';

// ─── Public listing DTO (no private fields) ────────────────────────────────────

export interface PublicListingDto {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  bodyType: BodyType;
  colour: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  engineCapacity: string | null;
  mileageKm: number;
  askPriceUsd: number;
  negotiable: boolean;
  /** Seller disclosure — no PII */
  sellerDisclosure: string | null;
  city: string;
  coverImageUrl: string | null;
  images: VehicleImageDto[];
  /** Populated when buyer summary is approved */
  inspectionSummary: BuyerInspectionSummaryDto | null;
  /** True when at least one approved inspection exists */
  bisellVerified: boolean;
  publishedAt: string;
  daysListed: number;
  viewCount: number;
}

/** Compact card shown in browse grid */
export interface PublicListingCardDto {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  bodyType: BodyType;
  askPriceUsd: number;
  negotiable: boolean;
  city: string;
  coverImageUrl: string | null;
  bisellVerified: boolean;
  inspectionScore: number | null;
  daysListed: number;
}

// ─── Browse filters ────────────────────────────────────────────────────────────

export interface CatalogueFilters extends CursorPaginationParams {
  bodyType?: BodyType | BodyType[];
  make?: string | string[];
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  city?: string;
  bisellVerified?: boolean;
  sortBy?: 'publishedAt' | 'askPriceUsd' | 'mileageKm' | 'year' | 'inspectionScore';
  sortDir?: SortDirection;
}

export type CatalogueResponse = CursorPaginatedResponse<PublicListingCardDto>;

// ─── Catalogue facets (drives Shop by make sidebar etc.) ─────────────────────

/** Distinct make + published-listing count. Sorted DESC by count on the API. */
export interface CatalogueMakeFacet {
  make: string;
  count: number;
}

/** Distinct model within a specific make. */
export interface CatalogueModelFacet {
  make: string;
  model: string;
  count: number;
}

export type CatalogueMakeFacetsResponse = CatalogueMakeFacet[];
export type CatalogueModelFacetsResponse = CatalogueModelFacet[];

// ─── Buyer-safe inspection summary ────────────────────────────────────────────

/** Category-level rollup shown in the Health Check card */
export interface InspectionCategoryResult {
  category: InspectionCategory;
  /** Average score 0–100 for the category */
  score: number;
  /** Worst rating in the category */
  worstRating: InspectionFindingRating;
  /** Count of PASS / WATCH / FAIL findings */
  counts: { PASS: number; WATCH: number; FAIL: number };
}

/** Individual finding row visible to buyer */
export interface BuyerFindingDto {
  label: string;
  rating: InspectionFindingRating;
  /** Observation note — no internal admin commentary */
  note: string | null;
}

export interface BuyerInspectionSummaryDto {
  listingId: string;
  inspectionDate: string;
  inspectorName: string;
  /** Overall score 0–100 */
  overallScore: number;
  roadworthy: boolean;
  categories: InspectionCategoryResult[];
  /** Filtered findings approved for buyer view */
  findings: BuyerFindingDto[];
  /** Inspector summary note approved for buyer view */
  inspectorNote: string | null;
}

// ─── Saved vehicles ────────────────────────────────────────────────────────────

export interface SavedVehicleDto {
  id: string;
  listing: PublicListingCardDto;
  savedAt: string;
}
