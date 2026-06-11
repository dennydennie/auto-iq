import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApprovedViewingLocationEntity } from "../entity/approved-viewing-location.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class ApprovedViewingLocationRepository extends AbstractRepository<ApprovedViewingLocationEntity> {
  constructor(@InjectRepository(ApprovedViewingLocationEntity) repository: Repository<ApprovedViewingLocationEntity>) {
    super(repository);
  }

  findActive(): Promise<ApprovedViewingLocationEntity[]> {
    return this.repository.find({
      where: { active: true },
      order: { city: "ASC", name: "ASC" },
    });
  }

  findActiveById(id: string): Promise<ApprovedViewingLocationEntity | null> {
    return this.repository.findOne({ where: { id, active: true } });
  }
}
