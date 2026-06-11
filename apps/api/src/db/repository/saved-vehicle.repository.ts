import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SavedVehicleEntity } from "../entity/saved-vehicle.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class SavedVehicleRepository extends AbstractRepository<SavedVehicleEntity> {
  constructor(@InjectRepository(SavedVehicleEntity) repository: Repository<SavedVehicleEntity>) {
    super(repository);
  }

  findByBuyerAndListing(buyerUserId: string, listingId: string): Promise<SavedVehicleEntity | null> {
    return this.repository.findOne({
      where: { buyerUserId, listingId },
      relations: ["listing", "listing.seller", "listing.specs", "listing.pricing", "listing.images"],
    });
  }

  async findPageForBuyer(buyerUserId: string, page: number, limit: number): Promise<[SavedVehicleEntity[], number]> {
    const query = this.repository
      .createQueryBuilder("saved")
      .leftJoinAndSelect("saved.listing", "listing")
      .leftJoinAndSelect("listing.seller", "seller")
      .leftJoinAndSelect("listing.specs", "specs")
      .leftJoinAndSelect("listing.pricing", "pricing")
      .leftJoinAndSelect("listing.images", "images")
      .where("saved.buyer_user_id = :buyerUserId", { buyerUserId })
      .andWhere("listing.status = 'PUBLISHED'")
      .orderBy("saved.createdAt", "DESC");
    const total = await query.clone().getCount();
    const rows = await query.skip((page - 1) * limit).take(limit).getMany();
    return [rows, total];
  }

  deleteByBuyerAndListing(buyerUserId: string, listingId: string): Promise<{ affected?: number | null }> {
    return this.repository.delete({ buyerUserId, listingId });
  }
}
