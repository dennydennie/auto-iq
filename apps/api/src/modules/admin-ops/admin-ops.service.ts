import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { VehicleStatusHistoryEntity } from "../../db/entity/vehicle-status-history.entity";
import { OwnershipVerificationRepository } from "../../db/repository/ownership-verification.repository";
import { InspectionReportRepository } from "../../db/repository/inspection-report.repository";
import { InspectionTaskRepository } from "../../db/repository/inspection-task.repository";
import { QuoteRequestRepository } from "../../db/repository/quote-request.repository";
import { VehicleRepository } from "../../db/repository/vehicle.repository";
import { VehicleRequestRepository } from "../../db/repository/vehicle-request.repository";
import { VehicleStatusHistoryRepository } from "../../db/repository/vehicle-status-history.repository";
import { ViewingAppointmentRepository } from "../../db/repository/viewing-appointment.repository";
import { AuditService } from "../audit/audit.service";
import { ListingsService } from "../listings/listings.service";
import { ListingStateService } from "../listings/listing-state.service";
import { StorageService } from "../storage/storage.service";
import {
  AdminListingListQueryDto,
  DelistListingDto,
  RejectListingDto,
  RequestChangesDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminOpsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    private readonly inspectionReportRepository: InspectionReportRepository,
    private readonly inspectionTaskRepository: InspectionTaskRepository,
    private readonly listingStateService: ListingStateService,
    private readonly listingsService: ListingsService,
    private readonly ownershipVerificationRepository: OwnershipVerificationRepository,
    private readonly quoteRequestRepository: QuoteRequestRepository,
    private readonly storageService: StorageService,
    private readonly vehicleRepository: VehicleRepository,
    private readonly vehicleRequestRepository: VehicleRequestRepository,
    private readonly vehicleStatusHistoryRepository: VehicleStatusHistoryRepository,
    private readonly viewingAppointmentRepository: ViewingAppointmentRepository,
  ) {}

  async dashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const [pendingReview, changesRequested, inspectionPending, ownershipPending, readyToPublish, openQuoteCount, openVehicleRequestCount, viewingsTodayCount] =
      await Promise.all([
        this.countVehiclesByStatus("SUBMITTED"),
        this.countVehiclesByStatus("CHANGES_REQUESTED"),
        this.countInspectionQueue(),
        this.countOwnershipQueue(),
        this.countVehiclesByStatus("APPROVED"),
        this.quoteRequestRepository.countOpen(),
        this.vehicleRequestRepository.countOpen(),
        this.viewingAppointmentRepository.countScheduledForDate(today),
      ]);

    return {
      queues: { pendingReview, changesRequested, inspectionPending, ownershipPending, readyToPublish },
      viewingsTodayCount,
      openQuoteCount,
      openVehicleRequestCount,
      recentActivityCount: 0,
    };
  }

  async list(query: AdminListingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [listings, total] = await this.vehicleRepository.findAdminPage({
      page,
      limit,
      status: query.status,
      sellerId: query.sellerId,
      search: query.search,
      sortBy: query.sortBy ?? "updatedAt",
      sortDir: query.sortDir ?? "DESC",
    });

    return {
      data: await Promise.all(listings.map((listing) => this.toAdminListingDto(listing.id))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async detail(listingId: string) {
    return this.toAdminListingDto(listingId);
  }

  async requestChanges(adminUserId: string, correlationId: string | undefined, listingId: string, body: RequestChangesDto) {
    const listing = await this.requireListing(listingId);
    const message = body.message.trim();
    const nextStatus = this.listingStateService.requestChanges(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      historyNote: message,
      changesNote: message,
      action: "listing.request_changes",
    });

    return this.toAdminListingDto(listing.id);
  }

  async reject(adminUserId: string, correlationId: string | undefined, listingId: string, body: RejectListingDto) {
    const listing = await this.requireListing(listingId);
    const reason = body.reason.trim();
    const nextStatus = this.listingStateService.reject(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.reject",
      historyNote: reason,
      changesNote: reason,
    });

    return this.toAdminListingDto(listing.id);
  }

  async approve(adminUserId: string, correlationId: string | undefined, listingId: string) {
    const listing = await this.requireListing(listingId);
    await this.assertApprovalReady(listing.id);
    const nextStatus = this.listingStateService.approve(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.approve",
      historyNote: "Listing approved",
    });

    return this.toAdminListingDto(listing.id);
  }

  async publish(adminUserId: string, correlationId: string | undefined, listingId: string) {
    const listing = await this.requireListing(listingId);
    const nextStatus = this.listingStateService.publish(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.publish",
      historyNote: "Listing published",
      publishedAt: new Date(),
    });

    return this.toAdminListingDto(listing.id);
  }

  async delist(adminUserId: string, correlationId: string | undefined, listingId: string, body: DelistListingDto) {
    const listing = await this.requireListing(listingId);
    const reason = body.reason.trim();
    const nextStatus = this.listingStateService.delist(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.delist",
      historyNote: reason,
      changesNote: reason,
    });

    return this.toAdminListingDto(listing.id);
  }

  async markReserved(adminUserId: string, correlationId: string | undefined, listingId: string) {
    const listing = await this.requireListing(listingId);
    const nextStatus = this.listingStateService.markReserved(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.reserve",
      historyNote: "Listing marked reserved",
    });

    return this.toAdminListingDto(listing.id);
  }

  async markSold(adminUserId: string, correlationId: string | undefined, listingId: string) {
    const listing = await this.requireListing(listingId);
    const nextStatus = this.listingStateService.markSold(listing.status);

    await this.applyListingTransition({
      adminUserId,
      correlationId,
      listingId,
      nextStatus,
      action: "listing.sold",
      historyNote: "Listing marked sold",
    });

    return this.toAdminListingDto(listing.id);
  }

  private async toAdminListingDto(listingId: string) {
    const listing = await this.vehicleRepository.findAdminById(listingId);
    if (!listing) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }
    const sellerView = await this.listingsService.detail(listing.sellerUserId, listing.id);
    const [ownershipVerification, inspectionTask, inspectionReport] = await Promise.all([
      this.ownershipVerificationRepository.findByListingId(listing.id),
      this.inspectionTaskRepository.findByListingId(listing.id),
      this.inspectionReportRepository.findByListingId(listing.id),
    ]);

    return {
      ...sellerView,
      documents: await Promise.all(listing.documents.map(async (document) => ({
        id: document.id,
        documentType: document.documentType,
        downloadUrl: await this.storageService.getDisplayUrl(document.storageKey),
        uploadedAt: document.createdAt.toISOString(),
        reviewStatus: document.reviewStatus,
        reviewNote: document.reviewNote ?? undefined,
      }))),
      adminNotes: listing.adminNotes ?? undefined,
      ownershipVerification: ownershipVerification ? {
        id: ownershipVerification.id,
        listingId: ownershipVerification.listingId,
        status: ownershipVerification.status,
        reviewedAt: ownershipVerification.reviewedAt?.toISOString() ?? null,
        reviewerAdminId: ownershipVerification.reviewerAdminId,
        note: ownershipVerification.note,
        createdAt: ownershipVerification.createdAt.toISOString(),
        updatedAt: ownershipVerification.updatedAt.toISOString(),
      } : null,
      inspectionTask: inspectionTask ? {
        id: inspectionTask.id,
        listingId: inspectionTask.listingId,
        listingSnapshot: await this.toInspectionTaskSnapshot(
          inspectionTask.listingSnapshot as unknown as InspectionTaskSnapshot,
        ),
        status: inspectionTask.status,
        assignedInspectorId: inspectionTask.assignedInspectorId,
        assignedInspectorName: inspectionTask.assignedInspector?.fullName ?? null,
        scheduledAt: inspectionTask.scheduledAt?.toISOString() ?? null,
        completedAt: inspectionTask.completedAt?.toISOString() ?? null,
        createdAt: inspectionTask.createdAt.toISOString(),
        updatedAt: inspectionTask.updatedAt.toISOString(),
      } : null,
      inspectionReport: inspectionReport ? {
        id: inspectionReport.id,
        taskId: inspectionReport.taskId,
        listingId: inspectionReport.listingId,
        submittedByInspectorId: inspectionReport.submittedByInspectorId,
        submittedByInspectorName: inspectionReport.submittedByInspector?.fullName ?? "",
        overallScore: inspectionReport.overallScore,
        roadworthy: inspectionReport.roadworthy,
        inspectorNote: inspectionReport.inspectorNote,
        findings: await Promise.all(inspectionReport.findings.map(async (finding) => ({
          id: finding.id,
          category: finding.category,
          label: finding.label,
          rating: finding.rating,
          note: finding.note,
          photoUrl: finding.photoStorageKey ? await this.storageService.getDisplayUrl(finding.photoStorageKey) : null,
        }))),
        buyerSummaryApproved: inspectionReport.buyerSummaryApproved,
        buyerSummaryApprovedAt: inspectionReport.buyerSummaryApprovedAt?.toISOString() ?? null,
        buyerSummaryApprovedByAdminId: inspectionReport.buyerSummaryApprovedByAdminId,
        createdAt: inspectionReport.createdAt.toISOString(),
        updatedAt: inspectionReport.updatedAt.toISOString(),
      } : null,
    };
  }

  private async assertApprovalReady(listingId: string) {
    const [verification, report] = await Promise.all([
      this.ownershipVerificationRepository.findByListingId(listingId),
      this.inspectionReportRepository.findByListingId(listingId),
    ]);
    if (verification?.status !== "APPROVED") {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Ownership verification must be approved before listing approval",
      });
    }
    if (!report?.buyerSummaryApproved) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Buyer inspection summary must be approved before listing approval",
      });
    }
  }

  private countVehiclesByStatus(status: string) {
    return this.dataSource.query(
      "SELECT COUNT(*)::int AS count FROM vehicles WHERE status = $1",
      [status],
    ).then((rows) => rows[0]?.count ?? 0);
  }

  private async countInspectionQueue() {
    const result = await this.dataSource.query(`
      SELECT COUNT(*)::int AS count
      FROM inspection_tasks
      WHERE status IN ('SCHEDULED', 'IN_PROGRESS', 'REPORT_SUBMITTED')
    `);
    return result[0]?.count ?? 0;
  }

  private async countOwnershipQueue() {
    const result = await this.dataSource.query(`
      SELECT COUNT(*)::int AS count
      FROM ownership_verifications
      WHERE status IN ('IN_REVIEW', 'NEEDS_CLARIFICATION')
    `);
    return result[0]?.count ?? 0;
  }

  private async requireListing(listingId: string) {
    const listing = await this.vehicleRepository.findAdminById(listingId);
    if (!listing) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
    }
    return listing;
  }

  private async applyListingTransition(input: {
    adminUserId: string;
    correlationId: string | undefined;
    listingId: string;
    nextStatus: string;
    action: string;
    historyNote: string;
    changesNote?: string;
    publishedAt?: Date;
  }) {
    await this.dataSource.transaction(async (manager) => {
      const listing = await manager.findOne(VehicleEntity, { where: { id: input.listingId } });
      if (!listing) {
        throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
      }
      listing.status = input.nextStatus as VehicleEntity["status"];
      if (input.changesNote !== undefined) {
        listing.changesNote = input.changesNote;
      }
      if (input.publishedAt !== undefined) {
        listing.publishedAt = input.publishedAt;
      }

      await manager.save(VehicleEntity, listing);
      await manager.save(VehicleStatusHistoryEntity, this.vehicleStatusHistoryRepository.create({
        vehicleId: listing.id,
        status: input.nextStatus as never,
        actorId: input.adminUserId,
        actorRole: "ADMIN",
        note: input.historyNote,
      }));
    });

    await this.logAdmin(input.adminUserId, input.correlationId, input.action, input.listingId, input.historyNote);
  }

  private async logAdmin(
    adminUserId: string,
    correlationId: string | undefined,
    action: string,
    listingId: string,
    note?: string,
  ) {
    await this.auditService.record({
      action,
      actorUserId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action,
      adminId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      note: note ?? null,
    });
  }

  private async toInspectionTaskSnapshot(snapshot: InspectionTaskSnapshot) {
    return {
      year: snapshot.year,
      make: snapshot.make,
      model: snapshot.model,
      coverImageUrl: snapshot.coverImageStorageKey
        ? await this.storageService.getDisplayUrl(snapshot.coverImageStorageKey)
        : null,
      city: snapshot.city,
    };
  }
}

interface InspectionTaskSnapshot {
  year: number;
  make: string;
  model: string;
  coverImageStorageKey: string | null;
  city: string;
}
