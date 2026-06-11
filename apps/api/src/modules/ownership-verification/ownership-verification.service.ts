import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { OwnershipVerificationEntity } from "../../db/entity/ownership-verification.entity";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { VehicleStatusHistoryEntity } from "../../db/entity/vehicle-status-history.entity";
import { VehicleStatusHistoryRepository } from "../../db/repository/vehicle-status-history.repository";
import type { OwnershipVerificationStatus } from "../../common/constants/listing.constants";
import { AuditService } from "../audit/audit.service";
import { ListingStateService } from "../listings/listing-state.service";
import { UpdateOwnershipVerificationDto } from "../admin-ops/dto/admin.dto";

@Injectable()
export class OwnershipVerificationService {
  constructor(
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    private readonly listingStateService: ListingStateService,
    private readonly vehicleStatusHistoryRepository: VehicleStatusHistoryRepository,
  ) {}

  async updateForListing(
    adminUserId: string,
    correlationId: string | undefined,
    listingId: string,
    body: UpdateOwnershipVerificationDto,
  ) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const listing = await manager.findOne(VehicleEntity, { where: { id: listingId } });
      if (!listing) {
        throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
      }

      const existing = await manager.findOne(OwnershipVerificationEntity, { where: { listingId } });
      const verification = existing ?? manager.create(OwnershipVerificationEntity, {
        listingId,
        status: "NOT_STARTED",
      });

      verification.status = this.transition(verification.status, body.status);
      verification.note = body.note?.trim() || null;
      verification.reviewerAdminId = adminUserId;
      verification.reviewedAt = new Date();

      const savedVerification = await manager.save(OwnershipVerificationEntity, verification);

      if ((verification.status === "IN_REVIEW" || verification.status === "NEEDS_CLARIFICATION") &&
          (listing.status === "SUBMITTED" || listing.status === "CHANGES_REQUESTED")) {
        listing.status = "OWNERSHIP_VERIFICATION_PENDING";
        await manager.save(VehicleEntity, listing);
        await manager.save(VehicleStatusHistoryEntity, this.vehicleStatusHistoryRepository.create({
          vehicleId: listing.id,
          status: listing.status,
          actorId: adminUserId,
          actorRole: "ADMIN",
          note: `Ownership verification ${verification.status.toLowerCase()}`,
        }));
      }

      if (verification.status === "REJECTED") {
        listing.status = this.listingStateService.reject(listing.status);
        await manager.save(VehicleEntity, listing);
        await manager.save(VehicleStatusHistoryEntity, this.vehicleStatusHistoryRepository.create({
          vehicleId: listing.id,
          status: listing.status,
          actorId: adminUserId,
          actorRole: "ADMIN",
          note: verification.note ?? "Ownership verification rejected",
        }));
      }

      return savedVerification;
    });

    await this.auditService.record({
      action: "ownership_verification.update",
      actorUserId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: `ownership_verification.${body.status.toLowerCase()}`,
      adminId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      note: saved.note,
    });

    return saved;
  }

  transition(current: OwnershipVerificationStatus, next: UpdateOwnershipVerificationDto["status"]) {
    if (current === "NOT_STARTED" && (next === "IN_REVIEW" || next === "APPROVED" || next === "REJECTED")) {
      return next;
    }
    if (current === "IN_REVIEW" && ["APPROVED", "NEEDS_CLARIFICATION", "REJECTED"].includes(next)) {
      return next;
    }
    if (current === "NEEDS_CLARIFICATION" && ["IN_REVIEW", "APPROVED", "REJECTED"].includes(next)) {
      return next;
    }
    throw new ConflictException({
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot move ownership verification from ${current} to ${next}`,
    });
  }
}
