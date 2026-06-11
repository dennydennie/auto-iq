/**
 * Pagination shapes used across list endpoints.
 */

/** Offset-based query params (default for admin queues) */
export interface OffsetPaginationParams {
  page?: number;   // 1-based, default 1
  limit?: number;  // default 20, max 100
}

/** Cursor-based query params (catalogue, activity feeds) */
export interface CursorPaginationParams {
  cursor?: string;  // opaque, base64-encoded
  limit?: number;   // default 20, max 100
}

/** Offset-based response wrapper */
export interface OffsetPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Cursor-based response wrapper */
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/** Shared sort direction */
export type SortDirection = 'ASC' | 'DESC';
