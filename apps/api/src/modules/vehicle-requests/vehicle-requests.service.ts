import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { VehicleRequestRepository } from "../../db/repository/vehicle-request.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { AuditService } from "../audit/audit.service";
import { RateLimitService } from "../identity/rate-limit.service";
import { ReferenceDataService } from "../reference-data/reference-data.service";
import {
  CreateVehicleRequestDto,
  UpdateVehicleRequestDto,
  VehicleRequestListQueryDto,
} from "./dto/vehicle-requests.dto";

@Injectable()
export class VehicleRequestsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly rateLimitService: RateLimitService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly vehicleRepository: VehicleRepository,
    private readonly vehicleRequestRepository: VehicleRequestRepository,
  ) {}

  async create(userId: string, correlationId: string | undefined, body: CreateVehicleRequestDto) {
    await this.rateLimitService.consume(`vehicle-request:${userId}`, 10, 3600);

    const request = await this.vehicleRequestRepository.save(this.vehicleRequestRepository.create({
      buyerUserId: userId,
      maxBudgetCents: body.maxBudgetCents,
      makeId: body.makeId?.trim() || null,
      model: body.model?.trim() || null,
      yearMin: body.yearMin ?? null,
      yearMax: body.yearMax ?? null,
      bodyTypeId: body.bodyTypeId ?? null,
      fuelTypeId: body.fuelTypeId ?? null,
      transmissionTypeId: body.transmissionTypeId ?? null,
      maxOdometerKm: body.maxOdometerKm ?? null,
      urgency: body.urgency,
      notes: body.notes?.trim() || null,
      status: "NEW",
      adminNote: null,
      matchedListingId: null,
    }));
    const hydrated = await this.vehicleRequestRepository.findByIdWithBuyer(request.id);

    await this.auditService.record({
      action: "vehicle_request.create",
      actorUserId: userId,
      entityType: "vehicle_request",
      entityId: request.id,
      outcome: "success",
      correlationId,
    });
    return this.toDto(hydrated ?? request);
  }

  async listBuyer(userId: string, query: VehicleRequestListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.vehicleRequestRepository.findBuyerPage(userId, {
      page,
      limit,
      status: query.status,
      urgency: query.urgency,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });
    return this.toPage(rows, page, limit, total);
  }

  async listAdmin(query: VehicleRequestListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.vehicleRequestRepository.findAdminPage({
      page,
      limit,
      status: query.status,
      urgency: query.urgency,
      sortBy: query.sortBy ?? "createdAt",
      sortDir: query.sortDir ?? "DESC",
    });
    return this.toPage(rows, page, limit, total);
  }

  async updateAdmin(adminUserId: string, correlationId: string | undefined, requestId: string, body: UpdateVehicleRequestDto) {
    const vehicleRequest = await this.vehicleRequestRepository.findByIdWithBuyer(requestId);
    if (!vehicleRequest) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Vehicle request not found" });
    }
    if (body.status) {
      vehicleRequest.status = this.transition(vehicleRequest.status, body.status);
    }
    vehicleRequest.adminNote = body.adminNote?.trim() || null;
    if (body.matchedListingId) {
      const listing = await this.vehicleRepository.findPublicBySlugOrId(body.matchedListingId);
      if (!listing || listing.status !== "PUBLISHED") {
        throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Matched listing not found" });
      }
      vehicleRequest.matchedListingId = listing.id;
    }

    const saved = await this.vehicleRequestRepository.save(vehicleRequest);
    await this.auditService.record({
      action: "vehicle_request.update",
      actorUserId: adminUserId,
      entityType: "vehicle_request",
      entityId: saved.id,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "vehicle_request.update",
      adminId: adminUserId,
      entityType: "vehicle_request",
      entityId: saved.id,
      note: saved.adminNote,
    });
    return this.toDto(saved);
  }

  transition(current: string, next: NonNullable<UpdateVehicleRequestDto["status"]>) {
    if (current === next) {
      return next;
    }
    const allowed: Record<string, string[]> = {
      NEW: ["ACKNOWLEDGED", "SOURCING", "MATCH_FOUND", "NO_MATCH", "CANCELLED"],
      ACKNOWLEDGED: ["SOURCING", "MATCH_FOUND", "NO_MATCH", "CANCELLED"],
      SOURCING: ["MATCH_FOUND", "NO_MATCH", "CANCELLED"],
      MATCH_FOUND: ["CANCELLED"],
    };
    if (!allowed[current]?.includes(next)) {
      throw new ConflictException({
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot move vehicle request from ${current} to ${next}`,
      });
    }
    return next;
  }

  private async toPage(rows: any[], page: number, limit: number, total: number) {
    const makes = await this.referenceDataService.getMakes();
    return {
      data: rows.map((row) => this.toDtoWithMakes(row, makes)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async toDto(request: any) {
    const makes = await this.referenceDataService.getMakes();
    return this.toDtoWithMakes(request, makes);
  }

  private toDtoWithMakes(request: any, makes: Array<{ id: string; name: string }>) {
    const makeName = request.makeId
      ? makes.find((entry) => entry.id === request.makeId)?.name ?? request.makeId
      : undefined;

    return {
      id: request.id,
      buyerId: request.buyerUserId,
      buyerName: request.buyer?.fullName ?? "",
      buyerPhone: request.buyer?.phone ?? "",
      maxBudgetCents: request.maxBudgetCents,
      makeId: request.makeId ?? undefined,
      makeName,
      model: request.model ?? undefined,
      yearMin: request.yearMin ?? undefined,
      yearMax: request.yearMax ?? undefined,
      bodyTypeId: request.bodyTypeId ?? undefined,
      fuelTypeId: request.fuelTypeId ?? undefined,
      transmissionTypeId: request.transmissionTypeId ?? undefined,
      maxOdometerKm: request.maxOdometerKm ?? undefined,
      urgency: request.urgency,
      notes: request.notes ?? undefined,
      status: request.status,
      adminNote: request.adminNote ?? undefined,
      matchedListingId: request.matchedListingId ?? undefined,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }
}
