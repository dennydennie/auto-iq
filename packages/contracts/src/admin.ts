import type { ListingStatus, QuoteStatus, VehicleRequestStatus, ViewingStatus } from './enums.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';
import type { SellerListingDto } from './listings.js';
import type { VehicleDocumentDto } from './storage.js';
import type { InspectionReportDto, InspectionTaskDto } from './inspections.js';
import type { OwnershipVerificationStatus } from './enums.js';

export interface OwnershipVerificationDto {
  id: string;
  listingId: string;
  status: OwnershipVerificationStatus;
  reviewedAt: string | null;
  reviewerAdminId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Admin listing DTO (extends seller view with private fields) ──────────────

export interface AdminListingDto extends SellerListingDto {
  /** Private documents visible only to admins */
  documents: VehicleDocumentDto[];
  /** Internal admin notes */
  adminNotes?: string;
  ownershipVerification?: OwnershipVerificationDto | null;
  inspectionTask?: InspectionTaskDto | null;
  inspectionReport?: InspectionReportDto | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AdminQueueCounts {
  pendingReview: number;
  changesRequested: number;
  inspectionPending: number;
  ownershipPending: number;
  readyToPublish: number;
}

export interface AdminDashboardDto {
  queues: AdminQueueCounts;
  viewingsTodayCount: number;
  openQuoteCount: number;
  openVehicleRequestCount: number;
  recentActivityCount: number;
}

// ─── Admin listing list params ────────────────────────────────────────────────

export interface AdminListingListParams extends OffsetPaginationParams {
  status?: ListingStatus;
  sellerId?: string;
  makeId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'submittedAt' | 'price';
  sortDir?: SortDirection;
}

// ─── Admin listing action requests ───────────────────────────────────────────

export interface RequestChangesRequest {
  /** Markdown-supported message shown to seller */
  message: string;
}

export interface RejectListingRequest {
  reason: string;
}

export interface DelistListingRequest {
  reason: string;
}

export interface UpdateOwnershipVerificationRequest {
  status: Extract<
    OwnershipVerificationStatus,
    'IN_REVIEW' | 'APPROVED' | 'NEEDS_CLARIFICATION' | 'REJECTED'
  >;
  note?: string;
}

export interface ApproveSummaryRequest {
  /** Optional override note before publishing buyer summary */
  note?: string;
}

// ─── Admin quote list params ──────────────────────────────────────────────────

export interface AdminQuoteListParams extends OffsetPaginationParams {
  status?: QuoteStatus;
  listingId?: string;
  buyerId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'offerPriceUsd';
  sortDir?: SortDirection;
}

export interface AdminUpdateQuoteRequest {
  status: Extract<QuoteStatus, 'UNDER_REVIEW' | 'ACCEPTED' | 'COUNTERED' | 'DECLINED'>;
  counterPriceUsd?: number;
  responseNote?: string;
}

// ─── Admin vehicle-request list params ───────────────────────────────────────

export interface AdminVehicleRequestListParams extends OffsetPaginationParams {
  status?: VehicleRequestStatus;
  sortBy?: 'createdAt' | 'updatedAt';
  sortDir?: SortDirection;
}

// ─── Admin viewing list params ────────────────────────────────────────────────

export interface AdminViewingListParams extends OffsetPaginationParams {
  status?: ViewingStatus;
  listingId?: string;
  inspectorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'scheduledAt' | 'createdAt';
  sortDir?: SortDirection;
}

// ─── Admin action log ─────────────────────────────────────────────────────────

export interface AdminActionLogDto {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  note?: string;
  createdAt: string;
}
