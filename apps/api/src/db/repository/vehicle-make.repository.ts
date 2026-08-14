import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleMakeEntity } from "../entity/vehicle-make.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleMakeRepository extends AbstractRepository<VehicleMakeEntity> {
  constructor(@InjectRepository(VehicleMakeEntity) repository: Repository<VehicleMakeEntity>) {
    super(repository);
  }

  findActiveCatalogue(): Promise<VehicleMakeEntity[]> {
    return this.repository
      .createQueryBuilder("make")
      .leftJoinAndSelect("make.models", "model", "model.active = :active", { active: true })
      .where("make.active = :active", { active: true })
      .orderBy("make.sortOrder", "ASC")
      .addOrderBy("make.name", "ASC")
      .addOrderBy("model.sortOrder", "ASC")
      .addOrderBy("model.name", "ASC")
      .getMany();
  }
}
