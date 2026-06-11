export const USER_ROLES = [
  "buyer",
  "seller",
  "inspector",
  "auto_electrician",
  "admin",
  "partner_admin",
  "system_administrator",
] as const;

export const LISTING_STATUSES = [
  "draft",
  "submitted",
  "inspection_pending",
  "ownership_verification_pending",
  "changes_requested",
  "approved",
  "published",
  "reserved",
  "sold",
  "rejected",
  "delisted",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface HealthCheckResponse {
  status: "ok";
  service: string;
  check: "live" | "ready";
}
