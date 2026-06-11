import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { VehicleEntity } from "../../db/entity/vehicle.entity";

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
    if (!listing.images?.length) {
      errors.push({ field: "images", message: "At least one photo is required before submission" });
    } else if (!listing.images.some((image) => image.isCover)) {
      errors.push({ field: "images", message: "One photo must be marked as the cover image" });
    }
    if (!listing.documents?.length) {
      errors.push({ field: "documents", message: "At least one document is required before submission" });
    }
    if (!sellerDisclosure.trim()) {
      errors.push({ field: "sellerDisclosure", message: "Seller disclosure is required before submission" });
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
