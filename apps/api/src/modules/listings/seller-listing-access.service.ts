import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "../../db/repository/user.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { ListingStateService } from "./listing-state.service";

@Injectable()
export class SellerListingAccessService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly listingStateService: ListingStateService,
  ) {}

  async assertSellerReady(userId: string): Promise<void> {
    const user = await this.userRepository.findProfileById(userId);
    if (!user?.sellerProfile || !user.roles.some((role) => role.role === "SELLER")) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Seller access is required",
      });
    }
    if (!user.sellerProfile.consentsComplete) {
      throw new ForbiddenException({
        code: "SELLER_PROFILE_INCOMPLETE",
        message: "Seller profile consents must be completed before using listings",
      });
    }
  }

  async getOwnedListing(userId: string, listingId: string): Promise<VehicleEntity> {
    await this.assertSellerReady(userId);
    const listing = await this.vehicleRepository.findOwnedById(listingId, userId);
    if (!listing) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Listing not found",
      });
    }
    return listing;
  }

  async getOwnedEditableListing(userId: string, listingId: string): Promise<VehicleEntity> {
    const listing = await this.getOwnedListing(userId, listingId);
    this.listingStateService.assertEditable(listing.status);
    return listing;
  }
}
