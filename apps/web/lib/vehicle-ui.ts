import type {
  BodyType,
  ListingStatus,
  ViewingStatus,
} from "@auto-iq/contracts/enums";

export type VehicleBodyTone = "bakkie" | "hatch" | "sedan" | "suv";

export function labelizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapBodyType(bodyType: BodyType): VehicleBodyTone {
  switch (bodyType) {
    case "BAKKIE":
      return "bakkie";
    case "HATCH":
      return "hatch";
    case "SUV":
      return "suv";
    default:
      return "sedan";
  }
}

export function mapListingStatus(status: ListingStatus) {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "CHANGES_REQUESTED":
      return "changes";
    case "DELISTED":
      return "delisted";
    case "DRAFT":
      return "draft";
    case "INSPECTION_PENDING":
      return "inspection";
    case "OWNERSHIP_VERIFICATION_PENDING":
      return "verifying";
    case "PUBLISHED":
      return "published";
    case "REJECTED":
      return "rejected";
    case "RESERVED":
      return "reserved";
    case "SOLD":
      return "sold";
    case "SUBMITTED":
      return "submitted";
    default:
      return "draft";
  }
}

export function relativeListingAge(daysListed: number) {
  if (daysListed <= 0) {
    return "Listed today";
  }

  if (daysListed === 1) {
    return "Listed 1 day ago";
  }

  return `Listed ${daysListed} days ago`;
}

export function viewingStatusTone(status: ViewingStatus) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "NO_SHOW":
      return "default";
    default:
      return "warning";
  }
}
