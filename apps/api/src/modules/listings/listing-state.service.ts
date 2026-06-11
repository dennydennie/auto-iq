import { ConflictException, Injectable } from "@nestjs/common";
import type { ListingStatus } from "../../common/constants/listing.constants";

const EDITABLE_STATUSES: ListingStatus[] = ["DRAFT", "CHANGES_REQUESTED"];

@Injectable()
export class ListingStateService {
  isEditable(status: ListingStatus): boolean {
    return EDITABLE_STATUSES.includes(status);
  }

  assertEditable(status: ListingStatus): void {
    if (!this.isEditable(status)) {
      throw new ConflictException({
        code: "LISTING_NOT_EDITABLE",
        message: "This listing can no longer be edited by the seller",
      });
    }
  }

  nextSubmittedStatus(current: ListingStatus): ListingStatus {
    if (current === "DRAFT" || current === "CHANGES_REQUESTED") {
      return "SUBMITTED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to SUBMITTED`,
    });
  }

  transitionForSeller(current: ListingStatus, next: ListingStatus): ListingStatus {
    if (next === "SUBMITTED") {
      return this.nextSubmittedStatus(current);
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Seller cannot transition listing to ${next}`,
    });
  }

  requestChanges(current: ListingStatus): ListingStatus {
    if (["SUBMITTED", "INSPECTION_PENDING", "OWNERSHIP_VERIFICATION_PENDING", "APPROVED"].includes(current)) {
      return "CHANGES_REQUESTED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to CHANGES_REQUESTED`,
    });
  }

  reject(current: ListingStatus): ListingStatus {
    if (["SUBMITTED", "INSPECTION_PENDING", "OWNERSHIP_VERIFICATION_PENDING", "CHANGES_REQUESTED"].includes(current)) {
      return "REJECTED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to REJECTED`,
    });
  }

  approve(current: ListingStatus): ListingStatus {
    if (["SUBMITTED", "INSPECTION_PENDING", "OWNERSHIP_VERIFICATION_PENDING"].includes(current)) {
      return "APPROVED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to APPROVED`,
    });
  }

  publish(current: ListingStatus): ListingStatus {
    if (current === "APPROVED") {
      return "PUBLISHED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to PUBLISHED`,
    });
  }

  markReserved(current: ListingStatus): ListingStatus {
    if (current === "PUBLISHED") {
      return "RESERVED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to RESERVED`,
    });
  }

  markSold(current: ListingStatus): ListingStatus {
    if (current === "PUBLISHED" || current === "RESERVED") {
      return "SOLD";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to SOLD`,
    });
  }

  delist(current: ListingStatus): ListingStatus {
    if (current === "PUBLISHED" || current === "RESERVED") {
      return "DELISTED";
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move listing from ${current} to DELISTED`,
    });
  }
}
