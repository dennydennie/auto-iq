import type { AdminListingDto } from "@auto-iq/contracts/admin";
import type { ListingStatus } from "@auto-iq/contracts/enums";
import {
  disclosureIsReady,
  missingRequiredDocuments,
  photosAreReady,
} from "./listing-readiness.ts";

export type AdminChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

const APPROVABLE_STATUSES: ListingStatus[] = [
  "SUBMITTED",
  "INSPECTION_PENDING",
  "OWNERSHIP_VERIFICATION_PENDING",
];

export function canApproveStatus(status: ListingStatus) {
  return APPROVABLE_STATUSES.includes(status);
}

export function adminApprovalReady(listing: AdminListingDto) {
  return (
    disclosureIsReady(listing.sellerDisclosure ?? "") &&
    photosAreReady(listing.images) &&
    missingRequiredDocuments(listing.documents).length === 0 &&
    listing.ownershipVerification?.status === "APPROVED" &&
    listing.inspectionReport?.buyerSummaryApproved === true
  );
}

export function adminReviewChecklist(
  listing: AdminListingDto,
): AdminChecklistItem[] {
  return [
    {
      id: "disclosure",
      label: "Seller disclosure submitted",
      complete: disclosureIsReady(listing.sellerDisclosure ?? ""),
    },
    {
      id: "photos",
      label: "At least 3 photos uploaded with a cover",
      complete: photosAreReady(listing.images),
    },
    {
      id: "documents",
      label: "Mandatory ownership documents uploaded",
      complete: missingRequiredDocuments(listing.documents).length === 0,
    },
    {
      id: "ownership",
      label: "Ownership verification approved",
      complete: listing.ownershipVerification?.status === "APPROVED",
    },
    {
      id: "inspection",
      label: "Inspection report submitted",
      complete: Boolean(listing.inspectionReport),
    },
    {
      id: "summary",
      label: "Buyer summary approved",
      complete: listing.inspectionReport?.buyerSummaryApproved === true,
    },
  ];
}

export function approvalBlockers(listing: AdminListingDto) {
  return adminReviewChecklist(listing)
    .filter((item) => !item.complete)
    .map((item) => item.label);
}
