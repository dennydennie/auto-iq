import type { DocumentType, ImageSlot } from './enums.js';

// ─── Presigned upload ─────────────────────────────────────────────────────────

export interface ImagePresignRequest {
  listingId: string;
  slot: ImageSlot;
  /** MIME type declared by client; server validates */
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Bytes */
  contentLength: number;
}

export interface ImagePresignResponse {
  /** PUT this URL directly from the client */
  uploadUrl: string;
  /** Pass this back to the register endpoint once upload completes */
  storageKey: string;
  /** URL expires at (ISO 8601) */
  expiresAt: string;
}

export interface DocumentPresignRequest {
  listingId: string;
  documentType: DocumentType;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  contentLength: number;
}

export interface DocumentPresignResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
}

// ─── Register uploaded file ───────────────────────────────────────────────────

export interface RegisterImageRequest {
  storageKey: string;
  slot: ImageSlot;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  contentLength: number;
  /** Whether this should be the cover image */
  isCover?: boolean;
}

export interface VehicleImageDto {
  id: string;
  slot: ImageSlot;
  /** Public URL for display (pre-signed if needed, or CDN URL) */
  url: string;
  isCover: boolean;
  uploadedAt: string;
}

export interface RegisterDocumentRequest {
  storageKey: string;
  documentType: DocumentType;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  contentLength: number;
}

export interface VehicleDocumentDto {
  id: string;
  documentType: DocumentType;
  /** Omitted on seller-facing GETs — use presign to download */
  downloadUrl?: string;
  uploadedAt: string;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  /** Admin-only rejection note */
  reviewNote?: string;
}
