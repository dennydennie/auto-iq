import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import { VehicleEntity } from "../entity/vehicle.entity";
import { AbstractRepository } from "./abstract.repository";

export interface SellerListingPageParams {
  sellerUserId: string;
  page: number;
  limit: number;
  status?: string;
  sortBy: "createdAt" | "updatedAt" | "askPriceUsd";
  sortDir: "ASC" | "DESC";
}

export interface AdminListingPageParams {
  page: number;
  limit: number;
  status?: string;
  sellerId?: string;
  search?: string;
  sortBy: "createdAt" | "updatedAt" | "submittedAt" | "price";
  sortDir: "ASC" | "DESC";
}

@Injectable()
export class VehicleRepository extends AbstractRepository<VehicleEntity> {
  constructor(@InjectRepository(VehicleEntity) repository: Repository<VehicleEntity>) {
    super(repository);
  }

  findOwnedById(id: string, sellerUserId: string): Promise<VehicleEntity | null> {
    return this.repository.findOne({
      where: { id, sellerUserId },
      relations: ["specs", "pricing", "images", "documents"],
    });
  }

  findOwnedTimeline(id: string, sellerUserId: string): Promise<VehicleEntity | null> {
    return this.repository.findOne({
      where: { id, sellerUserId },
      relations: ["history"],
    });
  }

  findAdminById(id: string): Promise<VehicleEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["seller", "specs", "pricing", "images", "documents", "history"],
    });
  }

  findPublicBySlugOrId(slugOrId: string): Promise<VehicleEntity | null> {
    const where = isUuid(slugOrId) ? [{ id: slugOrId }, { slug: slugOrId }] : { slug: slugOrId };
    return this.repository.findOne({
      where,
      relations: ["seller", "specs", "pricing", "images"],
    });
  }

  async findSellerPage(params: SellerListingPageParams): Promise<[VehicleEntity[], number]> {
    const query = this.repository
      .createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.specs", "specs")
      .leftJoinAndSelect("vehicle.pricing", "pricing")
      .leftJoinAndSelect("vehicle.images", "cover", "cover.is_cover = true")
      .where("vehicle.seller_user_id = :sellerUserId", { sellerUserId: params.sellerUserId });

    if (params.status) {
      query.andWhere("vehicle.status = :status", { status: params.status });
    }

    this.applySort(query, params.sortBy, params.sortDir);

    return query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();
  }

  async findAdminPage(params: AdminListingPageParams): Promise<[VehicleEntity[], number]> {
    const query = this.repository
      .createQueryBuilder("vehicle")
      .leftJoin("vehicle.seller", "seller")
      .leftJoin("vehicle.specs", "specs")
      .leftJoin("vehicle.pricing", "pricing");

    if (params.status) {
      query.andWhere("vehicle.status = :status", { status: params.status });
    }
    if (params.sellerId) {
      query.andWhere("vehicle.seller_user_id = :sellerId", { sellerId: params.sellerId });
    }
    if (params.search) {
      query.andWhere(new Brackets((search) => {
        search
          .where("vehicle.slug ILIKE :term", { term: `%${params.search}%` })
          .orWhere("specs.make ILIKE :term", { term: `%${params.search}%` })
          .orWhere("specs.model ILIKE :term", { term: `%${params.search}%` })
          .orWhere("seller.full_name ILIKE :term", { term: `%${params.search}%` });
      }));
    }

    this.applyAdminSort(query, params.sortBy, params.sortDir);

    return query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(VehicleEntity)
      .set({ viewCount: () => '"view_count" + 1' })
      .where("id = :id", { id })
      .execute();
  }

  private applySort(
    query: SelectQueryBuilder<VehicleEntity>,
    sortBy: SellerListingPageParams["sortBy"],
    sortDir: SellerListingPageParams["sortDir"],
  ): void {
    if (sortBy === "askPriceUsd") {
      query.orderBy("pricing.ask_price_usd", sortDir, "NULLS LAST");
      return;
    }
    const column = sortBy === "createdAt" ? "vehicle.created_at" : "vehicle.updated_at";
    query.orderBy(column, sortDir);
  }

  private applyAdminSort(
    query: SelectQueryBuilder<VehicleEntity>,
    sortBy: AdminListingPageParams["sortBy"],
    sortDir: AdminListingPageParams["sortDir"],
  ): void {
    if (sortBy === "price") {
      query.orderBy("pricing.ask_price_usd", sortDir, "NULLS LAST");
      return;
    }
    if (sortBy === "submittedAt") {
      query.orderBy("vehicle.submitted_at", sortDir, "NULLS LAST");
      return;
    }
    const column = sortBy === "createdAt" ? "vehicle.created_at" : "vehicle.updated_at";
    query.orderBy(column, sortDir);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
