import type { QuoteStatus, PaymentPlan } from './enums.js';
import type { TimestampFields } from './identity.js';
import type { OffsetPaginationParams, SortDirection } from './pagination.js';

// ─── Buyer: create quote ──────────────────────────────────────────────────────

export interface CreateQuoteRequest {
  offerPriceUsd: number;
  paymentPlan: PaymentPlan;
  /** Optional message to seller */
  message?: string;
}

// ─── Quote DTO ────────────────────────────────────────────────────────────────

export interface QuoteDto extends TimestampFields {
  id: string;
  listingId: string;
  buyerId: string;
  /** Redacted for non-admin: shows only name */
  buyerName: string;
  offerPriceUsd: number;
  askPriceUsd: number;
  paymentPlan: PaymentPlan;
  message: string | null;
  status: QuoteStatus;
  /** Counter-offer price (admin/seller response) */
  counterPriceUsd: number | null;
  responseNote: string | null;
  respondedAt: string | null;
}

// ─── Admin: update quote ──────────────────────────────────────────────────────

export interface UpdateQuoteRequest {
  status: Extract<QuoteStatus, 'UNDER_REVIEW' | 'ACCEPTED' | 'COUNTERED' | 'DECLINED'>;
  counterPriceUsd?: number;
  responseNote?: string;
}

// ─── List filters ─────────────────────────────────────────────────────────────

export interface QuoteListParams extends OffsetPaginationParams {
  listingId?: string;
  buyerId?: string;
  status?: QuoteStatus;
  sortBy?: 'createdAt' | 'offerPriceUsd';
  sortDir?: SortDirection;
}
