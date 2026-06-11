export const LISTING_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "INSPECTION_PENDING",
  "OWNERSHIP_VERIFICATION_PENDING",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "REJECTED",
  "DELISTED",
] as const;

export const BODY_TYPES = ["SEDAN", "SUV", "HATCH", "BAKKIE", "VAN", "COUPE", "WAGON"] as const;
export const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"] as const;
export const TRANSMISSION_TYPES = ["AUTOMATIC", "MANUAL", "CVT", "DSG"] as const;
export const DRIVE_TYPES = ["FWD", "RWD", "4WD", "AWD"] as const;
export const CONDITION_GRADES = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
export const DOCUMENT_TYPES = [
  "REGISTRATION_BOOK",
  "INSURANCE_CERTIFICATE",
  "POLICE_CLEARANCE",
  "ROADWORTHY_CERTIFICATE",
  "PURCHASE_IMPORT_DOCS",
  "SELLER_ID",
] as const;
export const IMAGE_SLOTS = [
  "FRONT_THREE_QUARTER",
  "REAR_THREE_QUARTER",
  "DRIVER_SIDE",
  "PASSENGER_SIDE",
  "INTERIOR_FRONT",
  "INTERIOR_REAR",
  "DASHBOARD",
  "ENGINE_BAY",
  "BOOT",
  "FRONT_LEFT_WHEEL",
  "ODOMETER",
  "VIN_PLATE",
] as const;
export const DOCUMENT_REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const INSPECTION_TASK_STATUSES = [
  "UNASSIGNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "BUYER_SUMMARY_APPROVED",
] as const;
export const INSPECTION_FINDING_RATINGS = ["PASS", "WATCH", "FAIL"] as const;
export const INSPECTION_CATEGORIES = [
  "ENGINE",
  "ELECTRICAL",
  "BODY",
  "TYRES",
  "BRAKES",
  "INTERIOR",
  "SUMMARY",
] as const;
export const OWNERSHIP_VERIFICATION_STATUSES = [
  "NOT_STARTED",
  "IN_REVIEW",
  "APPROVED",
  "NEEDS_CLARIFICATION",
  "REJECTED",
] as const;
export const QUOTE_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "ACCEPTED",
  "COUNTERED",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
  "CANCELLED",
] as const;
export const PAYMENT_PLANS = ["FULL_CASH", "BANK_TRANSFER", "OTHER"] as const;
export const VEHICLE_REQUEST_STATUSES = [
  "NEW",
  "ACKNOWLEDGED",
  "SOURCING",
  "MATCH_FOUND",
  "NO_MATCH",
  "CANCELLED",
] as const;
export const URGENCY_LEVELS = ["ASAP", "ONE_MONTH", "BROWSING"] as const;
export const VIEWING_STATUSES = [
  "REQUESTED",
  "PENDING_SELLER_CONFIRMATION",
  "CONFIRMED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export const VIEWING_PARTICIPANT_ROLES = ["BUYER", "SELLER", "ADMIN"] as const;
export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;
export const NOTIFICATION_STATUSES = ["QUEUED", "SENT", "FAILED", "DEAD_LETTER"] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];
export type DriveType = (typeof DRIVE_TYPES)[number];
export type ConditionGrade = (typeof CONDITION_GRADES)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type ImageSlot = (typeof IMAGE_SLOTS)[number];
export type DocumentReviewStatus = (typeof DOCUMENT_REVIEW_STATUSES)[number];
export type InspectionTaskStatus = (typeof INSPECTION_TASK_STATUSES)[number];
export type InspectionFindingRating = (typeof INSPECTION_FINDING_RATINGS)[number];
export type InspectionCategory = (typeof INSPECTION_CATEGORIES)[number];
export type OwnershipVerificationStatus = (typeof OWNERSHIP_VERIFICATION_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];
export type VehicleRequestStatus = (typeof VEHICLE_REQUEST_STATUSES)[number];
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];
export type ViewingParticipantRole = (typeof VIEWING_PARTICIPANT_ROLES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
