import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { InspectionReportEntity } from "../../db/entity/inspection-report.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { VehicleImageEntity } from "../../db/entity/vehicle-image.entity";
import { VehiclePricingEntity } from "../../db/entity/vehicle-pricing.entity";
import { VehicleSpecsEntity } from "../../db/entity/vehicle-specs.entity";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { CatalogueQueryDto } from "./dto/catalogue.dto";

interface CursorPayload {
  sortValue: number | string;
  id: string;
}

@Injectable()
export class CatalogueQueryService {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: CatalogueQueryDto) {
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? "publishedAt";
    const sortDir = query.sortDir ?? "DESC";
    const cursor = decodeCursor(query.cursor);

    const builder = this.dataSource
      .createQueryBuilder()
      .from(VehicleEntity, "vehicle")
      .innerJoin(VehicleSpecsEntity, "specs", "specs.vehicle_id = vehicle.id")
      .innerJoin(VehiclePricingEntity, "pricing", "pricing.vehicle_id = vehicle.id")
      .innerJoin(UserEntity, "seller", "seller.id = vehicle.seller_user_id")
      .leftJoin(VehicleImageEntity, "cover", "cover.vehicle_id = vehicle.id AND cover.is_cover = true")
      .leftJoin(
        InspectionReportEntity,
        "report",
        "report.listing_id = vehicle.id AND report.buyer_summary_approved = true",
      )
      .where("vehicle.status = 'PUBLISHED'");

    if (query.bodyType?.length) {
      builder.andWhere("specs.body_type IN (:...bodyTypes)", { bodyTypes: query.bodyType });
    }
    if (query.make?.length) {
      builder.andWhere("specs.make IN (:...makes)", { makes: query.make });
    }
    if (query.model) {
      builder.andWhere("specs.model ILIKE :model", { model: `%${query.model.trim()}%` });
    }
    if (query.yearMin !== undefined) {
      builder.andWhere("specs.year >= :yearMin", { yearMin: query.yearMin });
    }
    if (query.yearMax !== undefined) {
      builder.andWhere("specs.year <= :yearMax", { yearMax: query.yearMax });
    }
    if (query.priceMin !== undefined) {
      builder.andWhere("pricing.ask_price_usd >= :priceMin", { priceMin: query.priceMin });
    }
    if (query.priceMax !== undefined) {
      builder.andWhere("pricing.ask_price_usd <= :priceMax", { priceMax: query.priceMax });
    }
    if (query.mileageMax !== undefined) {
      builder.andWhere("specs.mileage_km <= :mileageMax", { mileageMax: query.mileageMax });
    }
    if (query.transmission) {
      builder.andWhere("specs.transmission = :transmission", { transmission: query.transmission });
    }
    if (query.fuelType) {
      builder.andWhere("specs.fuel_type = :fuelType", { fuelType: query.fuelType });
    }
    if (query.city) {
      builder.andWhere("seller.city ILIKE :city", { city: `%${query.city.trim()}%` });
    }
    if (query.bisellVerified !== undefined) {
      builder.andWhere(query.bisellVerified ? "report.id IS NOT NULL" : "report.id IS NULL");
    }

    const sortColumn = resolveSortColumn(sortBy);
    if (cursor) {
      const comparator = sortDir === "DESC" ? "<" : ">";
      builder.andWhere(
        `(${sortColumn} ${comparator} :cursorValue OR (${sortColumn} = :cursorValue AND vehicle.id ${comparator} :cursorId))`,
        { cursorValue: cursor.sortValue, cursorId: cursor.id },
      );
    }

    builder
      .select([
        "vehicle.id AS id",
        "vehicle.slug AS slug",
        "vehicle.published_at AS published_at",
        "pricing.ask_price_usd AS ask_price_usd",
        "pricing.negotiable AS negotiable",
        "specs.year AS year",
        "specs.make AS make",
        "specs.model AS model",
        "specs.body_type AS body_type",
        "specs.mileage_km AS mileage_km",
        "seller.city AS city",
        "cover.storage_key AS cover_storage_key",
        "report.overall_score AS inspection_score",
      ])
      .orderBy(sortColumn, sortDir, "NULLS LAST")
      .addOrderBy("vehicle.id", sortDir)
      .limit(limit + 1);

    const rows = await builder.getRawMany<CatalogueRow>();
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];

    return {
      rows: pageRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        year: Number(row.year),
        make: row.make,
        model: row.model,
        bodyType: row.body_type,
        askPriceUsd: Number(row.ask_price_usd),
        negotiable: Boolean(row.negotiable),
        city: row.city,
        coverImageStorageKey: row.cover_storage_key,
        inspectionScore: row.inspection_score === null ? null : Number(row.inspection_score),
        publishedAt: new Date(row.published_at),
      })),
      meta: {
        hasMore,
        nextCursor: hasMore && last ? encodeCursor({
          sortValue: cursorSortValue(last, sortBy),
          id: last.id,
        }) : null,
      },
    };
  }

  async explainPublishedPath() {
    return this.dataSource.query(`
      EXPLAIN
      SELECT vehicle.id
      FROM vehicles vehicle
      JOIN vehicle_specs specs ON specs.vehicle_id = vehicle.id
      JOIN vehicle_pricing pricing ON pricing.vehicle_id = vehicle.id
      WHERE vehicle.status = 'PUBLISHED'
      ORDER BY vehicle.published_at DESC, vehicle.id DESC
      LIMIT 20
    `);
  }
}

interface CatalogueRow {
  id: string;
  slug: string;
  published_at: string;
  ask_price_usd: string;
  negotiable: boolean;
  year: string;
  make: string;
  model: string;
  body_type: string;
  mileage_km: string;
  city: string;
  cover_storage_key: string | null;
  inspection_score: string | null;
}

function resolveSortColumn(sortBy: CatalogueQueryDto["sortBy"]) {
  switch (sortBy) {
    case "askPriceUsd":
      return "pricing.ask_price_usd";
    case "mileageKm":
      return "specs.mileage_km";
    case "year":
      return "specs.year";
    case "inspectionScore":
      return "report.overall_score";
    default:
      return "vehicle.published_at";
  }
}

function cursorSortValue(row: CatalogueRow, sortBy: CatalogueQueryDto["sortBy"]) {
  switch (sortBy) {
    case "askPriceUsd":
      return Number(row.ask_price_usd);
    case "mileageKm":
      return Number(row.mileage_km);
    case "year":
      return Number(row.year);
    case "inspectionScore":
      return row.inspection_score === null ? -1 : Number(row.inspection_score);
    default:
      return row.published_at;
  }
}

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined): CursorPayload | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CursorPayload;
  } catch {
    return null;
  }
}
