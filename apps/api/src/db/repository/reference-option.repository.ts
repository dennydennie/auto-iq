import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  ReferenceOptionEntity,
  type ReferenceOptionCategory,
} from "../entity/reference-option.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class ReferenceOptionRepository extends AbstractRepository<ReferenceOptionEntity> {
  constructor(@InjectRepository(ReferenceOptionEntity) repository: Repository<ReferenceOptionEntity>) {
    super(repository);
  }

  findActive(): Promise<ReferenceOptionEntity[]> {
    return this.repository.find({
      where: { active: true },
      order: { category: "ASC", sortOrder: "ASC", label: "ASC" },
    });
  }

  findAnyById(id: string): Promise<ReferenceOptionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByCategoryAndCode(
    category: ReferenceOptionCategory,
    code: string,
  ): Promise<ReferenceOptionEntity | null> {
    return this.repository.findOne({ where: { category, code } });
  }

  countActive(category: ReferenceOptionCategory): Promise<number> {
    return this.repository.count({ where: { category, active: true } });
  }

  async findActiveCodes(
    category: ReferenceOptionCategory,
    codes: string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) return new Set();
    const rows = await this.repository.find({
      select: { code: true },
      where: { category, code: In(codes), active: true },
    });
    return new Set(rows.map((row) => row.code));
  }

  async findAdminPage(input: {
    page: number;
    limit: number;
    category?: ReferenceOptionCategory;
    search?: string;
    active?: boolean;
  }): Promise<[ReferenceOptionEntity[], number]> {
    const query = this.repository.createQueryBuilder("option");
    if (input.category) query.andWhere("option.category = :category", { category: input.category });
    if (input.search) {
      query.andWhere("(option.code ILIKE :search OR option.label ILIKE :search)", {
        search: `%${input.search}%`,
      });
    }
    if (input.active !== undefined) query.andWhere("option.active = :active", { active: input.active });
    return query
      .orderBy("option.category", "ASC")
      .addOrderBy("option.sortOrder", "ASC")
      .addOrderBy("option.label", "ASC")
      .skip((input.page - 1) * input.limit)
      .take(input.limit)
      .getManyAndCount();
  }
}
