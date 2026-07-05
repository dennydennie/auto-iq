import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { VehicleEntity } from "../../db/entity/vehicle.entity";

// Kept in sync with the client-side checklist in
// apps/web/components/seller/submit-listing-action.tsx so sellers never see
// the button unlock only to be bounced by a 422 from the API.
const MIN_PHOTOS = 3;
const MIN_DOCUMENTS = 1;
const MIN_DISCLOSURE_LENGTH = 20;

@Injectable()
export class ListingWizardValidator {
  validateForSubmit(listing: VehicleEntity, sellerDisclosure: string): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!listing.specs) {
      errors.push({ field: "specs", message: "Vehicle basics are required before submission" });
    }
    if (!listing.pricing) {
      errors.push({ field: "pricing", message: "Price is required before submission" });
    }

    const photoCount = listing.images?.length ?? 0;
    if (photoCount < MIN_PHOTOS) {
      errors.push({
        field: "images",
        message: `At least ${MIN_PHOTOS} photos are required (front three-quarter, driver side, interior).`,
      });
    } else if (!listing.images?.some((image) => image.isCover)) {
      errors.push({
        field: "images",
        message: "One photo must be marked as the cover image",
      });
    }

    const documentCount = listing.documents?.length ?? 0;
    if (documentCount < MIN_DOCUMENTS) {
      errors.push({
        field: "documents",
        message: `At least ${MIN_DOCUMENTS} ownership document is required before submission`,
      });
    }

    if (sellerDisclosure.trim().length < MIN_DISCLOSURE_LENGTH) {
      errors.push({
        field: "sellerDisclosure",
        message: `Seller disclosure must be at least ${MIN_DISCLOSURE_LENGTH} characters — describe service history or known issues.`,
      });
    }

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        code: "WIZARD_INCOMPLETE",
        message: "Listing wizard is incomplete",
        details: errors,
      });
    }
  }
}
