import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { QuoteRequestRepository } from "../../db/repository/quote-request.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { AuditService } from "../audit/audit.service";
import { RateLimitService } from "../identity/rate-limit.service";
import { QuoteListQueryDto, UpdateQuoteDto } from "./dto/quotes.dto";

@Injectable()
export class QuotesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly quoteRepository: QuoteRequestRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async create(userId: string, correlationId: string | undefined, listingId: string, body: {
    offerPriceUsd: number;
    paymentPlan: string;
    message?: string;
  }) {
    await this.rateLimitService.consume(`quote:${userId}`, 10, 3600);

    const listing = await this.vehicleRepository.findPublicBySlugOrId(listingId);
    if (!listing || listing.status !== "PUBLISHED") {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }
    if (listing.sellerUserId === userId) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Sellers cannot request quotes on their own listings",
      });
    }

    const quote = await this.quoteRepository.save(this.quoteRepository.create({
      listingId: listing.id,
      buyerUserId: userId,
      offerPriceUsd: body.offerPriceUsd.toFixed(2),
      askPriceUsd: listing.pricing.askPriceUsd,
      paymentPlan: body.paymentPlan as never,
      message: body.message?.trim() || null,
      status: "NEW",
      counterPriceUsd: null,
      responseNote: null,
      respondedAt: null,
    }));

    const listingWithCount = await this.vehicleRepository.findAdminById(listing.id);
    if (listingWithCount) {
      listingWithCount.quoteCount += 1;
      await this.vehicleRepository.save(listingWithCount);
    }

    const hydrated = await this.quoteRepository.findByIdWithRelations(quote.id);
    await this.auditService.record({
      action: "quote.create",
      actorUserId: userId,
      entityType: "quote",
      entityId: quote.id,
      outcome: "success",
      correlationId,
    });
    return this.toDto(hydrated ?? quote);
  }

  async listBuyer(userId: string, query: QuoteListQueryDto) {
    return this.listPage(await this.quoteRepository.findBuyerPage(userId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      listingId: query.listingId,
      buyerId: undefined,
      status: query.status,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    }), query.page ?? 1, query.limit ?? 20);
  }

  async listAdmin(query: QuoteListQueryDto) {
    return this.listPage(await this.quoteRepository.findAdminPage({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      listingId: query.listingId,
      buyerId: query.buyerId,
      status: query.status,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    }), query.page ?? 1, query.limit ?? 20);
  }

  async updateAdmin(adminUserId: string, correlationId: string | undefined, quoteId: string, body: UpdateQuoteDto) {
    const quote = await this.quoteRepository.findByIdWithRelations(quoteId);
    if (!quote) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Quote not found" });
    }

    quote.status = this.transition(quote.status, body.status);
    quote.counterPriceUsd = body.status === "COUNTERED"
      ? requiredCounter(body.counterPriceUsd).toFixed(2)
      : null;
    quote.responseNote = body.responseNote?.trim() || null;
    quote.respondedAt = new Date();
    const saved = await this.quoteRepository.save(quote);

    await this.auditService.record({
      action: "quote.update",
      actorUserId: adminUserId,
      entityType: "quote",
      entityId: quote.id,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "quote.update",
      adminId: adminUserId,
      entityType: "quote",
      entityId: quote.id,
      note: quote.responseNote,
    });
    return this.toDto(saved);
  }

  transition(current: string, next: UpdateQuoteDto["status"]) {
    if (current === next) {
      return next;
    }
    const allowed: Record<string, string[]> = {
      NEW: ["UNDER_REVIEW", "ACCEPTED", "COUNTERED", "DECLINED"],
      UNDER_REVIEW: ["ACCEPTED", "COUNTERED", "DECLINED"],
      COUNTERED: ["ACCEPTED", "DECLINED"],
    };
    if (!allowed[current]?.includes(next)) {
      throw new ConflictException({
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot move quote from ${current} to ${next}`,
      });
    }
    return next;
  }

  private async listPage(
    result: [any[], number],
    page: number,
    limit: number,
  ) {
    const [rows, total] = result;
    return {
      data: rows.map((row) => this.toDto(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private toDto(quote: any) {
    return {
      id: quote.id,
      listingId: quote.listingId,
      buyerId: quote.buyerUserId,
      buyerName: quote.buyer?.fullName ?? "",
      offerPriceUsd: Number(quote.offerPriceUsd),
      askPriceUsd: Number(quote.askPriceUsd),
      paymentPlan: quote.paymentPlan,
      message: quote.message,
      status: quote.status,
      counterPriceUsd: quote.counterPriceUsd === null ? null : Number(quote.counterPriceUsd),
      responseNote: quote.responseNote,
      respondedAt: quote.respondedAt?.toISOString() ?? null,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    };
  }
}

function requiredCounter(value: number | undefined) {
  if (!value) {
    throw new ConflictException({
      code: "VALIDATION_FAILED",
      message: "Counter price is required when countering a quote",
    });
  }
  return value;
}
