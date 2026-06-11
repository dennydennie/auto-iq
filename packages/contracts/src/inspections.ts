import type {
  InspectionTaskStatus, InspectionFindingRating, InspectionCategory,
} from './enums.js';
import type { TimestampFields } from './identity.js';

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface InspectionTaskDto extends TimestampFields {
  id: string;
  listingId: string;
  /** Snapshot of listing details at assignment */
  listingSnapshot: {
    year: number;
    make: string;
    model: string;
    coverImageUrl: string | null;
    city: string;
  };
  status: InspectionTaskStatus;
  assignedInspectorId: string | null;
  assignedInspectorName: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
}

// ─── Assign task (admin) ──────────────────────────────────────────────────────

export interface AssignInspectionRequest {
  inspectorId: string;
  scheduledAt: string;  // ISO 8601
  locationNote?: string;
}

// ─── Report capture (inspector) ───────────────────────────────────────────────

export interface InspectionFindingInput {
  category: InspectionCategory;
  label: string;
  rating: InspectionFindingRating;
  /** Inspector's observation note */
  note?: string;
  /** storageKey from a photo upload, if provided */
  photoStorageKey?: string;
}

export interface SubmitInspectionReportRequest {
  findings: InspectionFindingInput[];
  /** Overall inspector summary note */
  inspectorNote: string;
  roadworthy: boolean;
  /** Overall score computed by API (0–100); or let API compute from findings */
  overallScore?: number;
}

// ─── Full report (admin view) ─────────────────────────────────────────────────

export interface InspectionFindingDto {
  id: string;
  category: InspectionCategory;
  label: string;
  rating: InspectionFindingRating;
  note: string | null;
  photoUrl: string | null;
}

export interface InspectionReportDto extends TimestampFields {
  id: string;
  taskId: string;
  listingId: string;
  submittedByInspectorId: string;
  submittedByInspectorName: string;
  overallScore: number;
  roadworthy: boolean;
  inspectorNote: string;
  findings: InspectionFindingDto[];
  buyerSummaryApproved: boolean;
  buyerSummaryApprovedAt: string | null;
  buyerSummaryApprovedByAdminId: string | null;
}

export interface InspectionTaskDetailDto {
  task: InspectionTaskDto;
  report: InspectionReportDto | null;
}

// ─── Approve buyer summary (admin) ────────────────────────────────────────────

export interface ApproveBuyerSummaryRequest {
  /** Admin can override or trim the inspector note shown to buyers */
  buyerNote?: string;
  /** Override: which finding IDs to include in buyer summary. If omitted, API picks. */
  includedFindingIds?: string[];
}

// ─── Inspector dashboard ──────────────────────────────────────────────────────

export interface InspectorTaskListParams {
  status?: InspectionTaskStatus;
  page?: number;
  limit?: number;
}
