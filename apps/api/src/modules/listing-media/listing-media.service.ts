import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { VehicleImageRepository } from "../../db/repository/vehicle-image.repository";
import { StorageService } from "../storage/storage.service";
import { RegisterImageDto } from "./dto/register-image.dto";
import { SellerListingAccessService } from "../listings/seller-listing-access.service";
import { UpdateImageDto } from "./dto/manage-images.dto";

@Injectable()
export class ListingMediaService {
  constructor(
    private readonly accessService: SellerListingAccessService,
    private readonly storageService: StorageService,
    private readonly vehicleImageRepository: VehicleImageRepository,
  ) {}

  async register(userId: string, listingId: string, body: RegisterImageDto) {
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const metadata = await this.storageService.inspectPendingUpload(
      body.storageKey,
      "image",
      {
        userId,
        listingId,
        slot: body.slot,
        contentType: body.contentType,
        contentLength: body.contentLength,
      },
    );
    const images = await this.vehicleImageRepository.findByVehicleId(
      listing.id,
    );
    const existing = await this.vehicleImageRepository.findByVehicleIdAndSlot(
      listing.id,
      body.slot,
    );
    const shouldBeCover =
      body.isCover === true ||
      existing?.isCover === true ||
      (body.isCover === undefined && images.every((image) => !image.isCover));

    if (shouldBeCover) {
      await this.vehicleImageRepository.clearCover(listing.id);
    }

    const image =
      existing ??
      this.vehicleImageRepository.create({
        vehicleId: listing.id,
        slot: body.slot,
      });
    const previousStorageKey = existing?.storageKey;
    image.storageKey = metadata.storageKey;
    image.slot = body.slot;
    image.contentType = metadata.contentType;
    image.byteSize = metadata.byteSize;
    image.isCover = shouldBeCover;
    image.position = existing?.position ?? images.length;
    const saved = await this.vehicleImageRepository.save(image);
    await this.storageService.completePendingUpload(body.storageKey);
    if (previousStorageKey && previousStorageKey !== saved.storageKey) {
      await this.storageService.tryDeleteObject(previousStorageKey);
    }

    return this.toDto(saved);
  }

  async update(
    userId: string,
    listingId: string,
    imageId: string,
    body: UpdateImageDto,
  ) {
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const image = await this.ownedImage(listing.id, imageId);
    if (body.isCover === true && !image.isCover) {
      await this.vehicleImageRepository.clearCover(listing.id);
      image.isCover = true;
      await this.vehicleImageRepository.save(image);
    }
    return this.toDto(image);
  }

  async reorder(userId: string, listingId: string, imageIds: string[]) {
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const images = await this.vehicleImageRepository.findByVehicleId(
      listing.id,
    );
    this.assertCompleteOrder(
      images.map((image) => image.id),
      imageIds,
    );
    const byId = new Map(images.map((image) => [image.id, image]));
    const ordered = imageIds.map((id, position) => {
      const image = byId.get(id)!;
      image.position = position;
      return image;
    });
    await this.vehicleImageRepository.saveAll(ordered);
    return Promise.all(ordered.map((image) => this.toDto(image)));
  }

  async remove(userId: string, listingId: string, imageId: string) {
    const listing = await this.accessService.getOwnedEditableListing(
      userId,
      listingId,
    );
    const image = await this.ownedImage(listing.id, imageId);
    await this.vehicleImageRepository.remove(image);
    await this.ensureCoverAndPositions(listing.id, image.isCover);
    await this.storageService.tryDeleteObject(image.storageKey);
    return { deleted: true };
  }

  private async ownedImage(vehicleId: string, imageId: string) {
    const image = await this.vehicleImageRepository.findById(imageId);
    if (!image || image.vehicleId !== vehicleId) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Listing image not found",
      });
    }
    return image;
  }

  private assertCompleteOrder(currentIds: string[], requestedIds: string[]) {
    const current = new Set(currentIds);
    const requested = new Set(requestedIds);
    const isComplete =
      requestedIds.length === currentIds.length &&
      requested.size === requestedIds.length &&
      requestedIds.every((id) => current.has(id));
    if (!isComplete) {
      throw new BadRequestException({
        code: "INVALID_IMAGE_ORDER",
        message: "Image order must include every listing image exactly once",
      });
    }
  }

  private async ensureCoverAndPositions(
    vehicleId: string,
    coverRemoved: boolean,
  ) {
    const images = await this.vehicleImageRepository.findByVehicleId(vehicleId);
    images.sort((left, right) => left.position - right.position);
    images.forEach((image, index) => {
      image.position = index;
    });
    if (coverRemoved && images.length > 0) images[0].isCover = true;
    if (images.length > 0) await this.vehicleImageRepository.saveAll(images);
  }

  private async toDto(image: {
    id: string;
    slot: string;
    storageKey: string;
    isCover: boolean;
    position: number;
    createdAt: Date;
  }) {
    return {
      id: image.id,
      slot: image.slot,
      url: await this.storageService.getDisplayUrl(image.storageKey),
      isCover: image.isCover,
      position: image.position,
      uploadedAt: image.createdAt.toISOString(),
    };
  }
}
