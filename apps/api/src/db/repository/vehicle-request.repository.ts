import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { VehicleRequestEntity } from "../entity/vehicle-request.entity";
import { AbstractRepository } from "./abstract.repository";

export interface VehicleRequestPageParams {
  page: number;
  limit: number;
  status?: string;
  urgency?: string;
  sortBy: "createdAt" | "updatedAt" | "maxBudgetCents";
  sortDir: "ASC" | "DESC";
}

@Injectable()
export class VehicleRequestRepository extends AbstractRepository<VehicleRequestEntity> {
  constructor(@InjectRepository(VehicleRequestEntity) repository: Repository<VehicleRequestEntity>) {
    super(repository);
  }

  findByIdWithBuyer(id: string): Promise<VehicleRequestEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ["buyer"] });
  }

  async findBuyerPage(buyerUserId: string, params: VehicleRequestPageParams): Promise<[VehicleRequestEntity[], number]> {
    const query = this.baseQuery()
      .where("request.buyer_user_id = :buyerUserId", { buyerUserId });

    this.applyFilters(query, params);
    this.applySort(query, params.sortBy, params.sortDir);
    const total = await query.clone().getCount();
    const rows = await query.skip((params.page - 1) * params.limit).take(params.limit).getMany();
    return [rows, total];
  }

  async findAdminPage(params: VehicleRequestPageParams): Promise<[VehicleRequestEntity[], number]> {
    const query = this.baseQuery();
    this.applyFilters(query, params);
    this.applySort(query, params.sortBy, params.sortDir);
    const total = await query.clone().getCount();
    const rows = await query.skip((params.page - 1) * params.limit).take(params.limit).getMany();
    return [rows, total];
  }

  countOpen(): Promise<number> {
    return this.repository.count({
      where: [
        { status: "NEW" },
        { status: "ACKNOWLEDGED" },
        { status: "SOURCING" },
        { status: "MATCH_FOUND" },
      ],
    });
  }

  private baseQuery() {
    return this.repository.createQueryBuilder("request").leftJoinAndSelect("request.buyer", "buyer");
  }

  private applyFilters(
    query: SelectQueryBuilder<VehicleRequestEntity>,
    params: VehicleRequestPageParams,
  ): void {
    if (params.status) {
      query.andWhere("request.status = :status", { status: params.status });
    }
    if (params.urgency) {
      query.andWhere("request.urgency = :urgency", { urgency: params.urgency });
    }
  }

  private applySort(
    query: SelectQueryBuilder<VehicleRequestEntity>,
    sortBy: VehicleRequestPageParams["sortBy"],
    sortDir: VehicleRequestPageParams["sortDir"],
  ): void {
    if (sortBy === "maxBudgetCents") {
      query.orderBy("request.maxBudgetCents", sortDir);
      return;
    }
    const column = sortBy === "updatedAt" ? "request.updatedAt" : "request.createdAt";
    query.orderBy(column, sortDir);
  }
}
