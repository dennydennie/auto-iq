import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleMakeEntity } from "../entity/vehicle-make.entity";
import { VehicleModelEntity } from "../entity/vehicle-model.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class VehicleMakeRepository extends AbstractRepository<VehicleMakeEntity> {
  constructor(
    @InjectRepository(VehicleMakeEntity) repository: Repository<VehicleMakeEntity>,
    @InjectRepository(VehicleModelEntity) private readonly modelRepository: Repository<VehicleModelEntity>,
  ) {
    super(repository);
  }

  findAllWithModels() {
    return this.repository.find({
      relations: ["models"],
      order: { name: "ASC", models: { name: "ASC" } },
    });
  }

  async createMake(name: string) {
    const normalized = normalizeName(name);
    const slug = slugify(normalized);
    const existing = await this.repository.findOne({ where: { slug }, relations: ["models"] });
    if (existing) {
      return existing;
    }
    return this.repository.save(this.repository.create({ name: normalized, slug, logoUrl: null }));
  }

  async createModel(makeId: string, name: string) {
    const normalized = normalizeName(name);
    const slug = slugify(normalized);
    const existing = await this.modelRepository.findOne({ where: { makeId, slug } });
    if (existing) {
      return existing;
    }
    return this.modelRepository.save(this.modelRepository.create({ makeId, name: normalized, slug }));
  }
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function slugify(value: string): string {
  return normalizeName(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
