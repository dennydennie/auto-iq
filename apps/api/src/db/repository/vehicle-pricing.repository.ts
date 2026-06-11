import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehiclePricingEntity } from "../entity/vehicle-pricing.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehiclePricingRepository extends AbstractRepository<VehiclePricingEntity> {
  constructor(@InjectRepository(VehiclePricingEntity) repository: Repository<VehiclePricingEntity>) {
    super(repository);
  }
}
