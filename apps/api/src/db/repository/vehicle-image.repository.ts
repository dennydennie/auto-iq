import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { ImageSlot } from "../../common/constants/listing.constants";
import { VehicleImageEntity } from "../entity/vehicle-image.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleImageRepository extends AbstractRepository<VehicleImageEntity> {
  constructor(@InjectRepository(VehicleImageEntity) repository: Repository<VehicleImageEntity>) {
    super(repository);
  }

  findByVehicleId(vehicleId: string): Promise<VehicleImageEntity[]> {
    return this.repository.find({ where: { vehicleId } });
  }

  findByVehicleIdAndSlot(vehicleId: string, slot: ImageSlot): Promise<VehicleImageEntity | null> {
    return this.repository.findOne({ where: { vehicleId, slot } });
  }

  async clearCover(vehicleId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(VehicleImageEntity)
      .set({ isCover: false })
      .where("vehicle_id = :vehicleId AND is_cover = true", { vehicleId })
      .execute();
  }
}
