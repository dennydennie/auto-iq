import type { ViewingStatus, ViewingParticipantRole } from './enums.js';
import type { TimestampFields } from './identity.js';
import type { ApprovedViewingLocationDto } from './reference-data.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';

// ─── Buyer: request viewing ────────────────────────────────────────────────────

export interface RequestViewingRequest {
  /** ISO 8601 date, e.g. "2026-06-04" */
  preferredDate: string;
  /** 24h time string, e.g. "11:00" */
  preferredTime: string;
  locationId: string;
  /** Optional note to admin/seller */
  note?: string;
}

// ─── Admin: action requests ────────────────────────────────────────────────────

export interface ConfirmViewingRequest {
  /** Admin confirms at this exact slot (may differ from buyer preference) */
  confirmedAt: string;  // ISO 8601 datetime
  locationId: string;
  noteToParticipants?: string;
}

export interface RescheduleViewingRequest {
  newSlot: string;  // ISO 8601 datetime
  reason: string;
}

export interface CancelViewingRequest {
  reason: string;
}

export interface CompleteViewingRequest {
  outcome: 'COMPLETED' | 'NO_SHOW';
  note?: string;
}

// ─── Viewing DTO ──────────────────────────────────────────────────────────────

export interface ViewingParticipantDto {
  userId: string;
  name: string;
  role: ViewingParticipantRole;
  confirmed: boolean;
}

export interface ViewingDto extends TimestampFields {
  id: string;
  listingId: string;
  listingSnapshot: {
    year: number;
    make: string;
    model: string;
    coverImageUrl: string | null;
  };
  status: ViewingStatus;
  buyerId: string;
  buyerName: string;
  /** ISO 8601 preferred date/time supplied by buyer */
  preferredSlot: string;
  /** ISO 8601 confirmed slot (null until confirmed) */
  confirmedSlot: string | null;
  location: ApprovedViewingLocationDto | null;
  participants: ViewingParticipantDto[];
  note: string | null;
  outcomeNote: string | null;
  completedAt: string | null;
}

// ─── Admin calendar / list filters ────────────────────────────────────────────

export interface ViewingListParams extends OffsetPaginationParams {
  status?: ViewingStatus;
  listingId?: string;
  buyerId?: string;
  /** ISO date — filter confirmed viewings on this date */
  date?: string;
  sortBy?: 'confirmedSlot' | 'createdAt';
  sortDir?: SortDirection;
}

/** Week view summary used by viewing scheduler */
export interface ViewingCalendarEntry {
  id: string;
  listingId: string;
  buyerName: string;
  make: string;
  model: string;
  confirmedSlot: string;
  status: ViewingStatus;
  locationName: string;
}
