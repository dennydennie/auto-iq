import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleStatusHistoryEntity } from "../entity/vehicle-status-history.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleStatusHistoryRepository extends AbstractRepository<VehicleStatusHistoryEntity> {
  constructor(
    @InjectRepository(VehicleStatusHistoryEntity) repository: Repository<VehicleStatusHistoryEntity>,
  ) {
    super(repository);
  }

  findByVehicleId(vehicleId: string): Promise<VehicleStatusHistoryEntity[]> {
    return this.repository.find({
      where: { vehicleId },
      order: { occurredAt: "ASC" },
    });
  }
}
