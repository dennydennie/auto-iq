import type { UrgencyLevel, VehicleRequestStatus } from './enums.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateVehicleRequestRequest {
  /** Budget ceiling in ZWG cents */
  maxBudgetCents: number;
  makeId?: string;
  model?: string;
  /** e.g. 2018 */
  yearMin?: number;
  yearMax?: number;
  bodyTypeId?: string;
  fuelTypeId?: string;
  transmissionTypeId?: string;
  /** Max odometer reading in kilometres */
  maxOdometerKm?: number;
  urgency: UrgencyLevel;
  /** Free-text notes from buyer */
  notes?: string;
}

export interface UpdateVehicleRequestRequest {
  status?: VehicleRequestStatus;
  /** Admin note / internal memo */
  adminNote?: string;
  /** ID of a listing that matches the request */
  matchedListingId?: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface VehicleRequestDto {
  id: string;
  buyerId: string;
  /** Buyer display name */
  buyerName: string;
  buyerPhone: string;

  maxBudgetCents: number;
  makeId?: string;
  makeName?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  bodyTypeId?: string;
  fuelTypeId?: string;
  transmissionTypeId?: string;
  maxOdometerKm?: number;
  urgency: UrgencyLevel;
  notes?: string;

  status: VehicleRequestStatus;
  adminNote?: string;
  matchedListingId?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── List params ──────────────────────────────────────────────────────────────

export interface VehicleRequestListParams extends OffsetPaginationParams {
  status?: VehicleRequestStatus;
  urgency?: UrgencyLevel;
  sortBy?: 'createdAt' | 'updatedAt' | 'maxBudgetCents';
  sortDir?: SortDirection;
}
