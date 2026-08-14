import type {
  ListingStatus,
  QuoteStatus,
  UserRole,
  UserStatus,
  VehicleRequestStatus,
  ViewingStatus,
} from './enums.js';
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

// ─── Secondary admin operations ──────────────────────────────────────────────

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  role: UserRole;
  roles: UserRole[];
  accountStatus: UserStatus;
  accessActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface AdminUserListParams extends OffsetPaginationParams {
  search?: string;
  role?: UserRole;
  access?: 'ACTIVE' | 'SUSPENDED';
  sortBy?: 'createdAt' | 'fullName';
  sortDir?: SortDirection;
}

export interface UpdateAdminUserAccessRequest {
  active: boolean;
}

export interface UpdateAdminInspectorRoleRequest {
  granted: boolean;
}

export type AccountDeletionRequestStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export type AccountDeletionRequestSource = 'MOBILE' | 'PUBLIC_WEB' | 'WEB';

export interface AdminAccountDeletionRequestDto {
  id: string;
  email: string;
  source: AccountDeletionRequestSource;
  status: AccountDeletionRequestStatus;
  reason: string | null;
  identityVerified: boolean;
  dataHandlingConfirmed: boolean;
  processingNote: string | null;
  processedBy: { id: string; fullName: string } | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface AdminAccountDeletionRequestListParams
  extends OffsetPaginationParams {
  status?: AccountDeletionRequestStatus;
  search?: string;
}

export interface ProcessAdminAccountDeletionRequest {
  status: Extract<AccountDeletionRequestStatus, 'COMPLETED' | 'CANCELLED'>;
  identityVerified: boolean;
  dataHandlingConfirmed: boolean;
  note: string;
}

export interface AdminOperationsReportDto {
  generatedAt: string;
  range: { from: string; to: string };
  users: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
  };
  listings: {
    created: number;
    submitted: number;
    published: number;
    sold: number;
  };
  viewings: {
    requested: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  notifications: {
    queued: number;
    sent: number;
    failed: number;
    deadLetter: number;
    retryAttempts: number;
  };
}

export interface AdminViewingLocationDto {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminViewingLocationListParams extends OffsetPaginationParams {
  search?: string;
  active?: boolean;
}

export interface CreateAdminViewingLocationRequest {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateAdminViewingLocationRequest
  extends Partial<CreateAdminViewingLocationRequest> {
  active?: boolean;
}

export const REFERENCE_OPTION_CATEGORIES = [
  'BODY_TYPE',
  'FUEL_TYPE',
  'TRANSMISSION_TYPE',
  'DRIVE_TYPE',
  'CONDITION_GRADE',
] as const;

export type ReferenceOptionCategory = (typeof REFERENCE_OPTION_CATEGORIES)[number];

export interface AdminReferenceOptionDto {
  id: string;
  category: ReferenceOptionCategory;
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReferenceOptionListParams extends OffsetPaginationParams {
  category?: ReferenceOptionCategory;
  search?: string;
  active?: boolean;
}

export interface CreateAdminReferenceOptionRequest {
  category: ReferenceOptionCategory;
  code: string;
  label: string;
  sortOrder?: number;
}

export interface UpdateAdminReferenceOptionRequest {
  label?: string;
  sortOrder?: number;
  active?: boolean;
}
