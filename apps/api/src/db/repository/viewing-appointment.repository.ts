import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ViewingAppointmentEntity } from "../entity/viewing-appointment.entity";
import { AbstractRepository } from "./abstract.repository";

export interface ViewingPageParams {
  page: number;
  limit: number;
  status?: string;
  listingId?: string;
  buyerId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "confirmedSlot" | "createdAt";
  sortDir: "ASC" | "DESC";
}

@Injectable()
export class ViewingAppointmentRepository extends AbstractRepository<ViewingAppointmentEntity> {
  constructor(
    @InjectRepository(ViewingAppointmentEntity)
    repository: Repository<ViewingAppointmentEntity>,
  ) {
    super(repository);
  }

  findByIdWithRelations(id: string): Promise<ViewingAppointmentEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        "buyer",
        "seller",
        "location",
        "participants",
        "participants.user",
      ],
    });
  }

  async findBuyerPage(
    buyerUserId: string,
    params: ViewingPageParams,
  ): Promise<[ViewingAppointmentEntity[], number]> {
    const query = this.baseQuery().where(
      "viewing.buyer_user_id = :buyerUserId",
      { buyerUserId },
    );
    this.applyFilters(query, params);
    this.applySort(query, params);
    const total = await query
      .clone()
      .select("viewing.id")
      .distinct(true)
      .getCount();
    const rows = await query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();
    return [rows, total];
  }

  async findSellerPage(
    sellerUserId: string,
    params: ViewingPageParams,
  ): Promise<[ViewingAppointmentEntity[], number]> {
    const query = this.baseQuery().where(
      "viewing.seller_user_id = :sellerUserId",
      { sellerUserId },
    );
    this.applyFilters(query, params);
    this.applySort(query, params);
    const total = await query
      .clone()
      .select("viewing.id")
      .distinct(true)
      .getCount();
    const rows = await query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();
    return [rows, total];
  }

  async findAdminPage(
    params: ViewingPageParams,
  ): Promise<[ViewingAppointmentEntity[], number]> {
    const query = this.baseQuery();
    this.applyFilters(query, params);
    this.applySort(query, params);
    const total = await query
      .clone()
      .select("viewing.id")
      .distinct(true)
      .getCount();
    const rows = await query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();
    return [rows, total];
  }

  async countScheduledForDate(dateIso: string): Promise<number> {
    const start = `${dateIso}T00:00:00.000Z`;
    const end = `${dateIso}T23:59:59.999Z`;
    return this.repository
      .createQueryBuilder("viewing")
      .where("viewing.status IN ('CONFIRMED', 'RESCHEDULED')")
      .andWhere("viewing.confirmed_slot BETWEEN :start AND :end", {
        start,
        end,
      })
      .getCount();
  }

  findRemindersDue(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<ViewingAppointmentEntity[]> {
    return this.repository
      .createQueryBuilder("viewing")
      .leftJoinAndSelect("viewing.buyer", "buyer")
      .leftJoinAndSelect("viewing.seller", "seller")
      .leftJoinAndSelect("viewing.location", "location")
      .where("viewing.status IN ('CONFIRMED', 'RESCHEDULED')")
      .andWhere("viewing.confirmed_slot BETWEEN :windowStart AND :windowEnd", {
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
      })
      .getMany();
  }

  private baseQuery() {
    return this.repository
      .createQueryBuilder("viewing")
      .leftJoinAndSelect("viewing.buyer", "buyer")
      .leftJoinAndSelect("viewing.seller", "seller")
      .leftJoinAndSelect("viewing.location", "location")
      .leftJoinAndSelect("viewing.participants", "participants")
      .leftJoinAndSelect("participants.user", "participant_user");
  }

  private applyFilters(
    query: SelectQueryBuilder<ViewingAppointmentEntity>,
    params: ViewingPageParams,
  ): void {
    if (params.status) {
      query.andWhere("viewing.status = :status", { status: params.status });
    }
    if (params.listingId) {
      query.andWhere("viewing.listing_id = :listingId", {
        listingId: params.listingId,
      });
    }
    if (params.buyerId) {
      query.andWhere("viewing.buyer_user_id = :buyerId", {
        buyerId: params.buyerId,
      });
    }
    if (params.date) {
      query.andWhere("DATE(viewing.confirmed_slot) = :date", {
        date: params.date,
      });
    }
    if (params.dateFrom) {
      query.andWhere("viewing.confirmed_slot >= :dateFrom", {
        dateFrom: params.dateFrom,
      });
    }
    if (params.dateTo) {
      query.andWhere("viewing.confirmed_slot <= :dateTo", {
        dateTo: params.dateTo,
      });
    }
  }

  private applySort(
    query: SelectQueryBuilder<ViewingAppointmentEntity>,
    params: ViewingPageParams,
  ): void {
    const column =
      params.sortBy === "confirmedSlot"
        ? "viewing.confirmedSlot"
        : "viewing.createdAt";
    query.orderBy(column, params.sortDir);
  }
}
