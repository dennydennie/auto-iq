import { Injectable } from "@nestjs/common";
import { VehicleDocumentRepository } from "../../db/repository/vehicle-document.repository";
import { StorageService } from "../storage/storage.service";
import { SellerListingAccessService } from "../listings/seller-listing-access.service";
import { RegisterDocumentDto } from "./dto/register-document.dto";

@Injectable()
export class ListingDocumentsService {
  constructor(
    private readonly accessService: SellerListingAccessService,
    private readonly storageService: StorageService,
    private readonly vehicleDocumentRepository: VehicleDocumentRepository,
  ) {}

  async register(userId: string, listingId: string, body: RegisterDocumentDto) {
    const listing = await this.accessService.getOwnedEditableListing(userId, listingId);
    const metadata = await this.storageService.inspectPendingUpload(body.storageKey, "document");
    const existing = await this.vehicleDocumentRepository.findByVehicleIdAndType(listing.id, body.documentType);
    const document = existing ?? this.vehicleDocumentRepository.create({
      vehicleId: listing.id,
      documentType: body.documentType,
    });

    document.storageKey = metadata.storageKey;
    document.documentType = body.documentType;
    document.contentType = metadata.contentType;
    document.byteSize = metadata.byteSize;
    document.reviewStatus = "PENDING";
    document.reviewNote = null;

    const saved = await this.vehicleDocumentRepository.save(document);
    await this.storageService.completePendingUpload(body.storageKey);

    return {
      id: saved.id,
      documentType: saved.documentType,
      uploadedAt: saved.createdAt.toISOString(),
      reviewStatus: saved.reviewStatus,
    };
  }
}
