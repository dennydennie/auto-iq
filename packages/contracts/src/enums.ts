/**
 * Domain enums — single source of truth for all state machines.
 * Mirrors PostgreSQL enum definitions in apps/api.
 */

// ─── User & roles ────────────────────────────────────────────────────────────

export const USER_ROLES = [
  'BUYER',
  'SELLER',
  'INSPECTOR',
  'ADMIN',
  'PARTNER_ADMIN',
  'SYSTEM_ADMINISTRATOR',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CONSENT_TYPES = [
  'TERMS',
  'PRIVACY',
  'SELLER_RULES',
  'BUYER_RULES',
  'NO_SIDE_DEAL',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

// ─── Listing (vehicle) ────────────────────────────────────────────────────────

/**
 * Canonical listing status state machine.
 *
 *  DRAFT
 *    └─[submit]──────────────► SUBMITTED
 *                                 └─[assign inspection]──► INSPECTION_PENDING
 *                                 └─[request changes]────► CHANGES_REQUESTED ─[resubmit]─► SUBMITTED
 *                                 └─[start ownership]────► OWNERSHIP_VERIFICATION_PENDING
 *                                 └─[reject]─────────────► REJECTED
 *                                 └─[approve]────────────► APPROVED
 *                                                              └─[publish]──► PUBLISHED
 *                                                                               ├─[reserve]──► RESERVED ─[unreserve]─► PUBLISHED
 *                                                                               ├─[sold]──────► SOLD
 *                                                                               └─[delist]───► DELISTED
 */
export const LISTING_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'INSPECTION_PENDING',
  'OWNERSHIP_VERIFICATION_PENDING',
  'CHANGES_REQUESTED',
  'APPROVED',
  'PUBLISHED',
  'RESERVED',
  'SOLD',
  'REJECTED',
  'DELISTED',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

// ─── Inspection ───────────────────────────────────────────────────────────────

export const INSPECTION_TASK_STATUSES = [
  'UNASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'REPORT_SUBMITTED',
  'BUYER_SUMMARY_APPROVED',
] as const;
export type InspectionTaskStatus = (typeof INSPECTION_TASK_STATUSES)[number];

export const INSPECTION_FINDING_RATINGS = ['PASS', 'WATCH', 'FAIL'] as const;
export type InspectionFindingRating = (typeof INSPECTION_FINDING_RATINGS)[number];

export const INSPECTION_CATEGORIES = [
  'ENGINE',
  'ELECTRICAL',
  'BODY',
  'TYRES',
  'BRAKES',
  'INTERIOR',
  'SUMMARY',
] as const;
export type InspectionCategory = (typeof INSPECTION_CATEGORIES)[number];

// ─── Ownership verification ───────────────────────────────────────────────────

export const OWNERSHIP_VERIFICATION_STATUSES = [
  'NOT_STARTED',
  'IN_REVIEW',
  'APPROVED',
  'NEEDS_CLARIFICATION',
  'REJECTED',
] as const;
export type OwnershipVerificationStatus = (typeof OWNERSHIP_VERIFICATION_STATUSES)[number];

// ─── Quote ────────────────────────────────────────────────────────────────────

export const QUOTE_STATUSES = [
  'NEW',
  'UNDER_REVIEW',
  'ACCEPTED',
  'COUNTERED',
  'DECLINED',
  'WITHDRAWN',
  'EXPIRED',
  'CANCELLED',
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const PAYMENT_PLANS = ['FULL_CASH', 'BANK_TRANSFER', 'OTHER'] as const;
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];

// ─── Viewing ──────────────────────────────────────────────────────────────────

export const VIEWING_STATUSES = [
  'REQUESTED',
  'PENDING_SELLER_CONFIRMATION',
  'CONFIRMED',
  'RESCHEDULED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];

export const VIEWING_PARTICIPANT_ROLES = ['BUYER', 'SELLER', 'ADMIN'] as const;
export type ViewingParticipantRole = (typeof VIEWING_PARTICIPANT_ROLES)[number];

// ─── Vehicle request (sourcing) ───────────────────────────────────────────────

export const VEHICLE_REQUEST_STATUSES = [
  'NEW',
  'ACKNOWLEDGED',
  'SOURCING',
  'MATCH_FOUND',
  'NO_MATCH',
  'CANCELLED',
] as const;
export type VehicleRequestStatus = (typeof VEHICLE_REQUEST_STATUSES)[number];

export const URGENCY_LEVELS = ['ASAP', 'ONE_MONTH', 'BROWSING'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// ─── Notification ─────────────────────────────────────────────────────────────

export const NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ['QUEUED', 'SENT', 'FAILED', 'DEAD_LETTER'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// ─── Reference data ───────────────────────────────────────────────────────────

export const BODY_TYPES = ['SEDAN', 'SUV', 'HATCH', 'BAKKIE', 'VAN', 'COUPE', 'WAGON'] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'OTHER'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSION_TYPES = ['AUTOMATIC', 'MANUAL', 'CVT', 'DSG'] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const DRIVE_TYPES = ['FWD', 'RWD', '4WD', 'AWD'] as const;
export type DriveType = (typeof DRIVE_TYPES)[number];

export const CONDITION_GRADES = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as const;
export type ConditionGrade = (typeof CONDITION_GRADES)[number];

// ─── Document types ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  'REGISTRATION_BOOK',
  'INSURANCE_CERTIFICATE',
  'POLICE_CLEARANCE',
  'ROADWORTHY_CERTIFICATE',
  'PURCHASE_IMPORT_DOCS',
  'SELLER_ID',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const IMAGE_SLOTS = [
  'FRONT_THREE_QUARTER',
  'REAR_THREE_QUARTER',
  'DRIVER_SIDE',
  'PASSENGER_SIDE',
  'INTERIOR_FRONT',
  'INTERIOR_REAR',
  'DASHBOARD',
  'ENGINE_BAY',
  'BOOT',
  'FRONT_LEFT_WHEEL',
  'ODOMETER',
  'VIN_PLATE',
] as const;
export type ImageSlot = (typeof IMAGE_SLOTS)[number];
