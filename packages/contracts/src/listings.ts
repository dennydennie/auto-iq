import type {
  ListingStatus, BodyType, FuelType, TransmissionType, DriveType,
  ConditionGrade,
} from './enums.js';
import type { TimestampFields } from './identity.js';
import type { VehicleImageDto, VehicleDocumentDto } from './storage.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';

// ─── Shared sub-shapes ────────────────────────────────────────────────────────

export interface VehicleSpecsDto {
  makeId: string | null;
  make: string;
  modelId: string | null;
  model: string;
  year: number;
  bodyType: BodyType;
  colour: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  engineCapacity: string | null;  // e.g. "2.4L"
  mileageKm: number;
  condition: ConditionGrade;
  hasAccidentHistory: boolean;
  accidentNote: string | null;
  locationCoordinates: { lat: number; lng: number } | null;
}

export interface VehiclePricingDto {
  askPriceUsd: number;
  negotiable: boolean;
  currency: 'USD';
}

export interface ListingStatusHistoryDto {
  id: string;
  status: ListingStatus;
  actorId: string;
  actorRole: string;
  note: string | null;
  occurredAt: string;
}

// ─── Seller-facing listing DTO ────────────────────────────────────────────────

/** Full listing shape returned to the owning seller */
export interface SellerListingDto extends TimestampFields {
  id: string;
  slug: string;
  status: ListingStatus;
  specs: VehicleSpecsDto;
  pricing: VehiclePricingDto;
  images: VehicleImageDto[];
  /** Metadata only — no download URL unless explicitly requested */
  documents: VehicleDocumentDto[];
  sellerDisclosure: string | null;
  /** Total public views (when published) */
  viewCount: number;
  /** Confirmed viewing count */
  viewingCount: number;
  /** Quote request count */
  quoteCount: number;
  /** Changes note from admin (when status = CHANGES_REQUESTED) */
  changesNote: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
}

/** Summary card used in seller dashboard list */
export interface SellerListingSummaryDto {
  id: string;
  slug: string;
  status: ListingStatus;
  year: number;
  make: string;
  model: string;
  bodyType: BodyType;
  askPriceUsd: number;
  coverImageUrl: string | null;
  viewCount: number;
  viewingCount: number;
  quoteCount: number;
  changesNote: string | null;
  updatedAt: string;
}

// ─── Create / update requests ─────────────────────────────────────────────────

/** Step 1: vehicle basics */
export interface UpsertListingSpecsRequest {
  makeId?: string;
  make: string;
  modelId?: string;
  model: string;
  year: number;
  bodyType: BodyType;
  colour: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  engineCapacity?: string;
  mileageKm: number;
  condition: ConditionGrade;
  hasAccidentHistory: boolean;
  accidentNote?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}

/** Step 2a: set asking price */
export interface UpsertListingPricingRequest {
  askPriceUsd: number;
  negotiable?: boolean;
}

/** Seller disclosure text (part of step 1 or 4) */
export interface UpsertListingDisclosureRequest {
  sellerDisclosure: string;
}

/** Create a new DRAFT listing — all other fields patched via step routes */
export interface CreateListingRequest extends UpsertListingSpecsRequest {
  askPriceUsd: number;
  negotiable?: boolean;
}

/** Submit for review (DRAFT → SUBMITTED) */
export interface SubmitListingRequest {
  /** Final seller disclosure text */
  sellerDisclosure: string;
}

// ─── Seller list filters ──────────────────────────────────────────────────────

export interface SellerListingsParams extends OffsetPaginationParams {
  status?: ListingStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'askPriceUsd';
  sortDir?: SortDirection;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface ListingTimelineResponse {
  listingId: string;
  history: ListingStatusHistoryDto[];
}
