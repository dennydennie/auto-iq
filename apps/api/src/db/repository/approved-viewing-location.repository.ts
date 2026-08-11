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

  findAnyById(id: string): Promise<ApprovedViewingLocationEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  countActive(): Promise<number> {
    return this.repository.count({ where: { active: true } });
  }

  async findAdminPage(input: {
    page: number;
    limit: number;
    search?: string;
    active?: boolean;
  }): Promise<[ApprovedViewingLocationEntity[], number]> {
    const query = this.repository.createQueryBuilder("location");
    if (input.search) {
      query.andWhere(
        "(location.name ILIKE :search OR location.city ILIKE :search OR location.addressLine1 ILIKE :search)",
        { search: `%${input.search}%` },
      );
    }
    if (input.active !== undefined) {
      query.andWhere("location.active = :active", { active: input.active });
    }
    return query
      .orderBy("location.city", "ASC")
      .addOrderBy("location.name", "ASC")
      .skip((input.page - 1) * input.limit)
      .take(input.limit)
      .getManyAndCount();
  }
}
