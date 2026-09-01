import { Injectable, NotFoundException } from "@nestjs/common";
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
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const metadata = await this.storageService.inspectPendingUpload(
      body.storageKey,
      "document",
      {
        userId,
        listingId,
        documentType: body.documentType,
        contentType: body.contentType,
        contentLength: body.contentLength,
      },
    );
    const existing =
      await this.vehicleDocumentRepository.findByVehicleIdAndType(
        listing.id,
        body.documentType,
      );
    const document =
      existing ??
      this.vehicleDocumentRepository.create({
        vehicleId: listing.id,
        documentType: body.documentType,
      });

    const previousStorageKey = existing?.storageKey;
    document.storageKey = metadata.storageKey;
    document.documentType = body.documentType;
    document.contentType = metadata.contentType;
    document.byteSize = metadata.byteSize;
    document.reviewStatus = "PENDING";
    document.reviewNote = null;

    const saved = await this.vehicleDocumentRepository.save(document);
    await this.storageService.completePendingUpload(body.storageKey);
    if (previousStorageKey && previousStorageKey !== saved.storageKey) {
      await this.storageService.tryDeleteObject(previousStorageKey);
    }

    return {
      id: saved.id,
      documentType: saved.documentType,
      uploadedAt: saved.createdAt.toISOString(),
      reviewStatus: saved.reviewStatus,
    };
  }

  async remove(userId: string, listingId: string, documentId: string) {
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const document = await this.vehicleDocumentRepository.findById(documentId);
    if (!document || document.vehicleId !== listing.id) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Listing document not found",
      });
    }
    await this.vehicleDocumentRepository.remove(document);
    await this.storageService.tryDeleteObject(document.storageKey);
    return { deleted: true };
  }
}
