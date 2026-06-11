import { Injectable } from "@nestjs/common";
import { VehicleImageRepository } from "../../db/repository/vehicle-image.repository";
import { StorageService } from "../storage/storage.service";
import { RegisterImageDto } from "./dto/register-image.dto";
import { SellerListingAccessService } from "../listings/seller-listing-access.service";

@Injectable()
export class ListingMediaService {
  constructor(
    private readonly accessService: SellerListingAccessService,
    private readonly storageService: StorageService,
    private readonly vehicleImageRepository: VehicleImageRepository,
  ) {}

  async register(userId: string, listingId: string, body: RegisterImageDto) {
    const listing = await this.accessService.getOwnedEditableListing(userId, listingId);
    const metadata = await this.storageService.inspectPendingUpload(body.storageKey, "image");
    const images = await this.vehicleImageRepository.findByVehicleId(listing.id);
    const existing = await this.vehicleImageRepository.findByVehicleIdAndSlot(listing.id, body.slot);
    const shouldBeCover = body.isCover === true || existing?.isCover === true || images.every((image) => !image.isCover);

    if (shouldBeCover) {
      await this.vehicleImageRepository.clearCover(listing.id);
    }

    const image = existing ?? this.vehicleImageRepository.create({ vehicleId: listing.id, slot: body.slot });
    image.storageKey = metadata.storageKey;
    image.slot = body.slot;
    image.contentType = metadata.contentType;
    image.byteSize = metadata.byteSize;
    image.isCover = shouldBeCover;
    const saved = await this.vehicleImageRepository.save(image);
    await this.storageService.completePendingUpload(body.storageKey);

    return {
      id: saved.id,
      slot: saved.slot,
      url: await this.storageService.getDisplayUrl(saved.storageKey),
      isCover: saved.isCover,
      uploadedAt: saved.createdAt.toISOString(),
    };
  }
}
