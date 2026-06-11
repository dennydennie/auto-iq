import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { QuoteRequestEntity } from "../entity/quote-request.entity";
import { AbstractRepository } from "./abstract.repository";

export interface QuoteListPageParams {
  page: number;
  limit: number;
  listingId?: string;
  buyerId?: string;
  status?: string;
  sortBy: "createdAt" | "offerPriceUsd" | "updatedAt";
  sortDir: "ASC" | "DESC";
}

@Injectable()
export class QuoteRequestRepository extends AbstractRepository<QuoteRequestEntity> {
  constructor(@InjectRepository(QuoteRequestEntity) repository: Repository<QuoteRequestEntity>) {
    super(repository);
  }

  findByIdWithRelations(id: string): Promise<QuoteRequestEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["listing", "listing.pricing", "buyer"],
    });
  }

  async findBuyerPage(buyerUserId: string, params: QuoteListPageParams): Promise<[QuoteRequestEntity[], number]> {
    const query = this.baseQuery()
      .where("quote.buyer_user_id = :buyerUserId", { buyerUserId });

    this.applyFilters(query, params);
    this.applySort(query, params.sortBy, params.sortDir);
    const total = await query.clone().getCount();
    const rows = await query.skip((params.page - 1) * params.limit).take(params.limit).getMany();
    return [rows, total];
  }

  async findAdminPage(params: QuoteListPageParams): Promise<[QuoteRequestEntity[], number]> {
    const query = this.baseQuery();
    this.applyFilters(query, params);
    this.applySort(query, params.sortBy, params.sortDir);
    const total = await query.clone().getCount();
    const rows = await query.skip((params.page - 1) * params.limit).take(params.limit).getMany();
    return [rows, total];
  }

  countOpen(): Promise<number> {
    return this.repository.count({
      where: [{ status: "NEW" }, { status: "UNDER_REVIEW" }, { status: "COUNTERED" }],
    });
  }

  private baseQuery() {
    return this.repository
      .createQueryBuilder("quote")
      .leftJoinAndSelect("quote.listing", "listing")
      .leftJoinAndSelect("listing.pricing", "pricing")
      .leftJoinAndSelect("quote.buyer", "buyer");
  }

  private applyFilters(query: SelectQueryBuilder<QuoteRequestEntity>, params: QuoteListPageParams): void {
    if (params.listingId) {
      query.andWhere("quote.listing_id = :listingId", { listingId: params.listingId });
    }
    if (params.buyerId) {
      query.andWhere("quote.buyer_user_id = :buyerId", { buyerId: params.buyerId });
    }
    if (params.status) {
      query.andWhere("quote.status = :status", { status: params.status });
    }
  }

  private applySort(
    query: SelectQueryBuilder<QuoteRequestEntity>,
    sortBy: QuoteListPageParams["sortBy"],
    sortDir: QuoteListPageParams["sortDir"],
  ): void {
    if (sortBy === "offerPriceUsd") {
      query.orderBy("quote.offerPriceUsd", sortDir);
      return;
    }
    const column = sortBy === "updatedAt" ? "quote.updatedAt" : "quote.createdAt";
    query.orderBy(column, sortDir);
  }
}
