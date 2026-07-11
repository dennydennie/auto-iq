import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApprovedViewingLocationRepository } from "../../db/repository/approved-viewing-location.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { ViewingAppointmentRepository } from "../../db/repository/viewing-appointment.repository";
import { ViewingParticipantRepository } from "../../db/repository/viewing-participant.repository";
import { AuditService } from "../audit/audit.service";
import { RateLimitService } from "../identity/rate-limit.service";
import { NotificationService } from "../notifications/notification.service";
import { StorageService } from "../storage/storage.service";
import {
  AdminViewingListQueryDto,
  CancelViewingDto,
  CompleteViewingDto,
  ConfirmViewingDto,
  RequestViewingDto,
  RescheduleViewingDto,
  ViewingListQueryDto,
} from "./dto/viewings.dto";
import { ViewingStateService } from "./viewing-state.service";

@Injectable()
export class ViewingsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly locationRepository: ApprovedViewingLocationRepository,
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: RateLimitService,
    private readonly storageService: StorageService,
    private readonly userRepository: UserRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly viewingParticipantRepository: ViewingParticipantRepository,
    private readonly viewingRepository: ViewingAppointmentRepository,
    private readonly viewingStateService: ViewingStateService,
  ) {}

  async requestViewing(
    buyerUserId: string,
    correlationId: string | undefined,
    listingId: string,
    body: RequestViewingDto,
  ) {
    await this.rateLimitService.consume(`viewing:${buyerUserId}`, 10, 3600);
    const [buyer, listing, location, admins] = await Promise.all([
      this.userRepository.findProfileById(buyerUserId),
      this.vehicleRepository.findPublicBySlugOrId(listingId),
      this.locationRepository.findActiveById(body.locationId),
      this.userRepository.findByRole("ADMIN"),
    ]);
    if (!buyer) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Buyer not found",
      });
    }
    if (!listing || listing.status !== "PUBLISHED") {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Listing not found",
      });
    }
    if (!location) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Location not found",
      });
    }
    if (listing.sellerUserId === buyerUserId) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Sellers cannot request viewings on their own listings",
      });
    }

    const preferredSlot = parsePreferredSlot(
      body.preferredDate,
      body.preferredTime,
    );
    const cover =
      listing.images?.find((image) => image.isCover) ??
      listing.images?.[0] ??
      null;
    const viewing = await this.viewingRepository.save(
      this.viewingRepository.create({
        listingId: listing.id,
        buyerUserId,
        sellerUserId: listing.sellerUserId,
        status: "REQUESTED",
        preferredSlot,
        confirmedSlot: null,
        locationId: location.id,
        listingSnapshot: {
          year: listing.specs.year,
          make: listing.specs.make,
          model: listing.specs.model,
          coverImageStorageKey: cover?.storageKey ?? null,
        },
        note: body.note?.trim() || null,
        outcomeNote: null,
        completedAt: null,
      }),
    );
    await Promise.all([
      this.viewingParticipantRepository.save(
        this.viewingParticipantRepository.create({
          viewingId: viewing.id,
          userId: buyerUserId,
          role: "BUYER",
          confirmed: true,
        }),
      ),
      this.viewingParticipantRepository.save(
        this.viewingParticipantRepository.create({
          viewingId: viewing.id,
          userId: listing.sellerUserId,
          role: "SELLER",
          confirmed: false,
        }),
      ),
    ]);
    listing.viewingCount += 1;
    await this.vehicleRepository.save(listing);

    const payload = {
      viewingId: viewing.id,
      listingId: listing.id,
      preferredSlot: preferredSlot.toISOString(),
      locationName: location.name,
    };
    await this.notificationService.notifyUser({
      userId: listing.seller.id,
      email: listing.seller.email,
      phone: listing.seller.phone,
      template: "VIEWING_REQUESTED",
      idempotencyKeyBase: `viewing:${viewing.id}:requested:seller`,
      payload,
    });
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.notifyUser({
          userId: admin.id,
          email: admin.email,
          phone: admin.phone,
          template: "VIEWING_REQUESTED",
          idempotencyKeyBase: `viewing:${viewing.id}:requested:admin:${admin.id}`,
          payload,
          channels: ["EMAIL"],
        }),
      ),
    );

    await this.auditService.record({
      action: "viewing.request",
      actorUserId: buyerUserId,
      entityType: "viewing",
      entityId: viewing.id,
      outcome: "success",
      correlationId,
    });
    return this.detail(viewing.id);
  }

  async listBuyer(userId: string, query: ViewingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.viewingRepository.findBuyerPage(userId, {
      page,
      limit,
      status: query.status,
      listingId: query.listingId,
      buyerId: undefined,
      date: query.date,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });
    return this.pageResponse(rows, page, limit, total);
  }

  async listSeller(userId: string, query: ViewingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.viewingRepository.findSellerPage(userId, {
      page,
      limit,
      status: query.status,
      listingId: query.listingId,
      buyerId: undefined,
      date: query.date,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });
    return this.pageResponse(rows, page, limit, total);
  }

  async listAdmin(query: AdminViewingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.viewingRepository.findAdminPage({
      page,
      limit,
      status: query.status,
      listingId: query.listingId,
      buyerId: undefined,
      date: query.date,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });
    return this.pageResponse(rows, page, limit, total);
  }

  async sellerAcknowledge(
    sellerUserId: string,
    correlationId: string | undefined,
    viewingId: string,
  ) {
    const viewing = await this.requireViewing(viewingId);
    if (viewing.sellerUserId !== sellerUserId) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Viewing not found",
      });
    }

    viewing.status = this.viewingStateService.sellerAcknowledge(viewing.status);
    await this.viewingRepository.save(viewing);
    await this.markSellerParticipantConfirmed(viewing.id, sellerUserId);
    await this.auditService.record({
      action: "viewing.seller_confirm",
      actorUserId: sellerUserId,
      entityType: "viewing",
      entityId: viewing.id,
      outcome: "success",
      correlationId,
    });
    return this.detail(viewing.id);
  }

  async confirm(
    adminUserId: string,
    correlationId: string | undefined,
    viewingId: string,
    body: ConfirmViewingDto,
  ) {
    const [admin, location, viewing] = await Promise.all([
      this.userRepository.findProfileById(adminUserId),
      this.locationRepository.findActiveById(body.locationId),
      this.viewingRepository.findByIdWithRelations(viewingId),
    ]);
    if (!admin || !location || !viewing) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Viewing or location not found",
      });
    }

    viewing.status = this.viewingStateService.confirm(viewing.status);
    viewing.confirmedSlot = new Date(body.confirmedAt);
    viewing.locationId = location.id;
    viewing.note = body.noteToParticipants?.trim() || viewing.note;
    await this.viewingRepository.save(viewing);
    await this.upsertAdminParticipant(viewing.id, adminUserId);
    await this.markSellerParticipantConfirmed(viewing.id, viewing.sellerUserId);
    await this.notifyParticipants(viewing, "VIEWING_CONFIRMED", {
      viewingId: viewing.id,
      listingId: viewing.listingId,
      confirmedSlot: viewing.confirmedSlot.toISOString(),
      locationName: location.name,
    });
    await this.auditAdmin(
      adminUserId,
      correlationId,
      "viewing.confirm",
      viewing.id,
    );
    return this.detail(viewing.id);
  }

  async reschedule(
    adminUserId: string,
    correlationId: string | undefined,
    viewingId: string,
    body: RescheduleViewingDto,
  ) {
    const viewing = await this.requireViewing(viewingId);
    viewing.status = this.viewingStateService.reschedule(viewing.status);
    viewing.confirmedSlot = new Date(body.newSlot);
    viewing.note = body.reason.trim();
    await this.viewingRepository.save(viewing);
    await this.upsertAdminParticipant(viewing.id, adminUserId);
    await this.notifyParticipants(viewing, "VIEWING_RESCHEDULED", {
      viewingId: viewing.id,
      listingId: viewing.listingId,
      confirmedSlot: viewing.confirmedSlot.toISOString(),
      locationName: viewing.location.name,
      reason: body.reason.trim(),
    });
    await this.auditAdmin(
      adminUserId,
      correlationId,
      "viewing.reschedule",
      viewing.id,
      body.reason,
    );
    return this.detail(viewing.id);
  }

  async cancel(
    adminUserId: string,
    correlationId: string | undefined,
    viewingId: string,
    body: CancelViewingDto,
  ) {
    const viewing = await this.requireViewing(viewingId);
    viewing.status = this.viewingStateService.cancel(viewing.status);
    viewing.outcomeNote = body.reason.trim();
    viewing.completedAt = new Date();
    await this.viewingRepository.save(viewing);
    await this.upsertAdminParticipant(viewing.id, adminUserId);
    await this.notifyParticipants(viewing, "VIEWING_CANCELLED", {
      viewingId: viewing.id,
      listingId: viewing.listingId,
      reason: body.reason.trim(),
    });
    await this.auditAdmin(
      adminUserId,
      correlationId,
      "viewing.cancel",
      viewing.id,
      body.reason,
    );
    return this.detail(viewing.id);
  }

  async complete(
    adminUserId: string,
    correlationId: string | undefined,
    viewingId: string,
    body: CompleteViewingDto,
  ) {
    const viewing = await this.requireViewing(viewingId);
    viewing.status = this.viewingStateService.complete(
      viewing.status,
      body.outcome,
    );
    viewing.outcomeNote = body.note?.trim() || null;
    viewing.completedAt = new Date();
    await this.viewingRepository.save(viewing);
    await this.upsertAdminParticipant(viewing.id, adminUserId);
    await this.auditAdmin(
      adminUserId,
      correlationId,
      "viewing.complete",
      viewing.id,
      body.note,
    );
    return this.detail(viewing.id);
  }

  async detail(viewingId: string) {
    const viewing = await this.requireViewing(viewingId);
    return this.toDto(viewing);
  }

  private async pageResponse(
    rows: any[],
    page: number,
    limit: number,
    total: number,
  ) {
    return {
      data: await Promise.all(rows.map((row) => this.toDto(row))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async requireViewing(viewingId: string) {
    const viewing =
      await this.viewingRepository.findByIdWithRelations(viewingId);
    if (!viewing) {
      throw new NotFoundException({
        code: "RESOURCE_NOT_FOUND",
        message: "Viewing not found",
      });
    }
    return viewing;
  }

  private async notifyParticipants(
    viewing: any,
    template: any,
    payload: Record<string, unknown>,
  ) {
    await this.notificationService.notifyUser({
      userId: viewing.buyer.id,
      email: viewing.buyer.email,
      phone: viewing.buyer.phone,
      template,
      idempotencyKeyBase: `viewing:${viewing.id}:${template}:buyer`,
      payload,
    });
    await this.notificationService.notifyUser({
      userId: viewing.seller.id,
      email: viewing.seller.email,
      phone: viewing.seller.phone,
      template,
      idempotencyKeyBase: `viewing:${viewing.id}:${template}:seller`,
      payload,
    });
  }

  private async auditAdmin(
    adminUserId: string,
    correlationId: string | undefined,
    action: string,
    viewingId: string,
    note?: string,
  ) {
    await this.auditService.record({
      action,
      actorUserId: adminUserId,
      entityType: "viewing",
      entityId: viewingId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action,
      adminId: adminUserId,
      entityType: "viewing",
      entityId: viewingId,
      note: note ?? null,
    });
  }

  private async upsertAdminParticipant(viewingId: string, adminUserId: string) {
    const participants =
      await this.viewingParticipantRepository.findByViewingId(viewingId);
    const existing = participants.find(
      (participant) =>
        participant.userId === adminUserId && participant.role === "ADMIN",
    );
    if (existing) {
      existing.confirmed = true;
      await this.viewingParticipantRepository.save(existing);
      return;
    }
    await this.viewingParticipantRepository.save(
      this.viewingParticipantRepository.create({
        viewingId,
        userId: adminUserId,
        role: "ADMIN",
        confirmed: true,
      }),
    );
  }

  private async markSellerParticipantConfirmed(
    viewingId: string,
    sellerUserId: string,
  ) {
    const participants =
      await this.viewingParticipantRepository.findByViewingId(viewingId);
    const seller = participants.find(
      (participant) =>
        participant.userId === sellerUserId && participant.role === "SELLER",
    );
    if (!seller) {
      return;
    }
    seller.confirmed = true;
    await this.viewingParticipantRepository.save(seller);
  }

  private async toDto(viewing: any) {
    const snapshot = viewing.listingSnapshot as {
      year: number;
      make: string;
      model: string;
      coverImageStorageKey: string | null;
    };
    const participants =
      viewing.participants ??
      (await this.viewingParticipantRepository.findByViewingId(viewing.id));

    return {
      id: viewing.id,
      listingId: viewing.listingId,
      listingSnapshot: {
        year: snapshot.year,
        make: snapshot.make,
        model: snapshot.model,
        coverImageUrl: snapshot.coverImageStorageKey
          ? await this.storageService.getDisplayUrl(
              snapshot.coverImageStorageKey,
            )
          : null,
      },
      status: viewing.status,
      buyerId: viewing.buyerUserId,
      buyerName: viewing.buyer.fullName,
      preferredSlot: viewing.preferredSlot.toISOString(),
      confirmedSlot: viewing.confirmedSlot?.toISOString() ?? null,
      location: {
        id: viewing.location.id,
        name: viewing.location.name,
        addressLine1: viewing.location.addressLine1,
        addressLine2: viewing.location.addressLine2,
        city: viewing.location.city,
        coordinates:
          viewing.location.latitude && viewing.location.longitude
            ? {
                lat: Number(viewing.location.latitude),
                lng: Number(viewing.location.longitude),
              }
            : null,
        active: viewing.location.active,
      },
      participants: participants.map((participant: any) => ({
        userId: participant.userId,
        name: participant.user?.fullName ?? "",
        role: participant.role,
        confirmed: participant.confirmed,
      })),
      note: viewing.note,
      outcomeNote: viewing.outcomeNote,
      completedAt: viewing.completedAt?.toISOString() ?? null,
      createdAt: viewing.createdAt.toISOString(),
      updatedAt: viewing.updatedAt.toISOString(),
    };
  }
}

function parsePreferredSlot(preferredDate: string, preferredTime: string) {
  const preferredSlot = new Date(`${preferredDate}T${preferredTime}:00+02:00`);
  if (
    !isValidPreferredDate(preferredDate) ||
    Number.isNaN(preferredSlot.getTime())
  ) {
    throw new BadRequestException({
      code: "VALIDATION_FAILED",
      message: "Preferred viewing slot must be a valid date and time",
    });
  }
  return preferredSlot;
}

function isValidPreferredDate(preferredDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(preferredDate);
  if (!match) {
    return false;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
