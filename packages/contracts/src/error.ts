/**
 * Standard API error envelope.
 * Every non-2xx response from /api/v1 conforms to this shape.
 */
export interface ApiError {
  /** Machine-readable error code, e.g. "LISTING_NOT_FOUND", "INVALID_STATE_TRANSITION" */
  code: string;
  /** Human-readable message */
  message: string;
  /** Correlation ID from X-Correlation-ID response header — include in support tickets */
  correlationId: string;
  /** Field-level validation errors (present on 422) */
  details?: FieldError[];
  /** HTTP status code mirrored in body for client convenience */
  statusCode: number;
}

export interface FieldError {
  field: string;
  message: string;
  /** Value that failed validation (may be omitted for security) */
  value?: unknown;
}

/** Typed result wrapper — use in client layer, not over the wire */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

/** Well-known error codes produced by the API */
export const API_ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS:        'INVALID_CREDENTIALS',
  OTP_REQUIRED:              'OTP_REQUIRED',
  OTP_INVALID:                'OTP_INVALID',
  OTP_EXPIRED:                'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS:           'OTP_MAX_ATTEMPTS',
  SESSION_EXPIRED:            'SESSION_EXPIRED',
  DELIVERY_UNAVAILABLE:      'DELIVERY_UNAVAILABLE',
  // Authorization
  FORBIDDEN:                  'FORBIDDEN',
  RESOURCE_NOT_FOUND:         'RESOURCE_NOT_FOUND',
  // Domain / state machine
  INVALID_STATE_TRANSITION:   'INVALID_STATE_TRANSITION',
  LISTING_NOT_EDITABLE:       'LISTING_NOT_EDITABLE',
  WIZARD_INCOMPLETE:          'WIZARD_INCOMPLETE',
  // Files
  PRESIGN_FAILED:             'PRESIGN_FAILED',
  INVALID_FILE_TYPE:          'INVALID_FILE_TYPE',
  MAX_IMAGES_EXCEEDED:        'MAX_IMAGES_EXCEEDED',
  // Rate limits
  RATE_LIMITED:               'RATE_LIMITED',
  // Validation
  VALIDATION_FAILED:          'VALIDATION_FAILED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
