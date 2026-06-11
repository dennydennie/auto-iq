import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleSpecsEntity } from "../entity/vehicle-specs.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleSpecsRepository extends AbstractRepository<VehicleSpecsEntity> {
  constructor(@InjectRepository(VehicleSpecsEntity) repository: Repository<VehicleSpecsEntity>) {
    super(repository);
  }
}
