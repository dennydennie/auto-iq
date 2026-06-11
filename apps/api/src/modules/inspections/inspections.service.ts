import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { InspectionFindingEntity } from "../../db/entity/inspection-finding.entity";
import { InspectionReportEntity } from "../../db/entity/inspection-report.entity";
import { InspectionTaskEntity } from "../../db/entity/inspection-task.entity";
import { InspectionFindingRepository } from "../../db/repository/inspection-finding.repository";
import { InspectionReportRepository } from "../../db/repository/inspection-report.repository";
import { InspectionTaskRepository } from "../../db/repository/inspection-task.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../storage/storage.service";
import { VehicleStatusHistoryRepository } from "../../db/repository/vehicle-status-history.repository";
import { ApproveBuyerSummaryDto, AssignInspectionDto } from "../admin-ops/dto/admin.dto";
import { SubmitInspectionReportDto } from "./dto/inspections.dto";

@Injectable()
export class InspectionsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
    private readonly inspectionFindingRepository: InspectionFindingRepository,
    private readonly inspectionReportRepository: InspectionReportRepository,
    private readonly inspectionTaskRepository: InspectionTaskRepository,
    private readonly storageService: StorageService,
    private readonly userRepository: UserRepository,
    private readonly vehicleStatusHistoryRepository: VehicleStatusHistoryRepository,
  ) {}

  async assignTask(
    adminUserId: string,
    correlationId: string | undefined,
    listingId: string,
    body: AssignInspectionDto,
  ) {
    const inspector = await this.userRepository.findProfileById(body.inspectorId);
    if (!inspector || !inspector.roles.some((role) => role.role === "INSPECTOR")) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Inspector not found" });
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const listingSnapshot = await manager.findOne(VehicleEntity, {
        where: { id: listingId },
        relations: ["specs", "images", "seller"],
      });
      if (!listingSnapshot) {
        throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Listing not found" });
      }

      const existing = await manager.findOne(InspectionTaskEntity, { where: { listingId } });
      const savedTask = await manager.save(InspectionTaskEntity, {
        id: existing?.id,
        listingId,
        assignedInspectorId: inspector.id,
        status: "SCHEDULED",
        scheduledAt: new Date(body.scheduledAt),
        completedAt: null,
        locationNote: body.locationNote?.trim() || null,
        listingSnapshot: {
          year: listingSnapshot.specs?.year,
          make: listingSnapshot.specs?.make ?? "",
          model: listingSnapshot.specs?.model ?? "",
          coverImageStorageKey: listingSnapshot.images?.find((image) => image.isCover)?.storageKey ?? null,
          city: listingSnapshot.seller?.city ?? "",
        },
      });

      if (listingSnapshot.status === "SUBMITTED" || listingSnapshot.status === "OWNERSHIP_VERIFICATION_PENDING") {
        listingSnapshot.status = "INSPECTION_PENDING";
        await manager.save(VehicleEntity, listingSnapshot);
        await manager.save(
          this.vehicleStatusHistoryRepository.create({
            vehicleId: listingSnapshot.id,
            status: listingSnapshot.status,
            actorId: adminUserId,
            actorRole: "ADMIN",
            note: `Inspection assigned to ${inspector.fullName}`,
          }),
        );
      }

      return savedTask;
    });

    await this.auditService.record({
      action: "inspection.assign",
      actorUserId: adminUserId,
      entityType: "inspection_task",
      entityId: saved.id,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "inspection.assign",
      adminId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      note: inspector.fullName,
    });

    return this.toTaskDto(saved, inspector.fullName);
  }

  async listInspectorTasks(inspectorId: string, status?: InspectionTaskEntity["status"], page = 1, limit = 20) {
    const [tasks, total] = await this.inspectionTaskRepository.findInspectorPage(inspectorId, status, page, limit);
    return {
      data: await Promise.all(tasks.map(async (task) => this.toTaskDto(task, task.assignedInspector?.fullName ?? null))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getInspectorTaskDetail(inspectorId: string, taskId: string) {
    const task = await this.inspectionTaskRepository.findByIdForInspector(taskId, inspectorId);
    if (!task) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Inspection task not found" });
    }
    const report = await this.inspectionReportRepository.findByTaskId(task.id);
    return {
      task: await this.toTaskDto(task, task.assignedInspector?.fullName ?? null),
      report: report ? await this.toReportDto(report) : null,
    };
  }

  async submitReport(
    inspectorId: string,
    correlationId: string | undefined,
    taskId: string,
    body: SubmitInspectionReportDto,
  ) {
    const task = await this.inspectionTaskRepository.findByIdForInspector(taskId, inspectorId);
    if (!task) {
      throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Inspection task not found" });
    }
    if (!["SCHEDULED", "IN_PROGRESS", "REPORT_SUBMITTED"].includes(task.status)) {
      throw new ConflictException({
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot submit inspection report from ${task.status}`,
      });
    }

    const report = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(InspectionReportEntity, { where: { taskId: task.id } });
      const savedReport = await manager.save(InspectionReportEntity, {
        id: existing?.id,
        taskId: task.id,
        listingId: task.listingId,
        submittedByInspectorId: inspectorId,
        overallScore: body.overallScore ?? scoreFromFindings(body.findings),
        roadworthy: body.roadworthy,
        inspectorNote: body.inspectorNote.trim(),
        buyerNote: existing?.buyerNote ?? null,
        buyerSummaryApproved: false,
        buyerSummaryApprovedAt: null,
        buyerSummaryApprovedByAdminId: null,
      });

      await manager.delete(InspectionFindingEntity, { reportId: savedReport.id });
      await manager.save(
        InspectionFindingEntity,
        body.findings.map((finding) => ({
          reportId: savedReport.id,
          category: finding.category,
          label: finding.label.trim(),
          rating: finding.rating,
          note: finding.note?.trim() || null,
          photoStorageKey: finding.photoStorageKey?.trim() || null,
          includeInBuyerSummary: false,
        })),
      );

      await manager.update(InspectionTaskEntity, { id: task.id }, {
        status: "REPORT_SUBMITTED",
        completedAt: new Date(),
      });
      return savedReport;
    });

    await this.auditService.record({
      action: "inspection.report_submit",
      actorUserId: inspectorId,
      entityType: "inspection_task",
      entityId: task.id,
      outcome: "success",
      correlationId,
    });
    const savedReport = await this.inspectionReportRepository.findByTaskId(task.id);
    return this.toReportDto(savedReport ?? report);
  }

  async approveBuyerSummary(
    adminUserId: string,
    correlationId: string | undefined,
    listingId: string,
    body: ApproveBuyerSummaryDto,
  ) {
    const task = await this.inspectionTaskRepository.findByListingId(listingId);
    const report = await this.inspectionReportRepository.findByListingId(listingId);
    if (!task || !report) {
      throw new ConflictException({
        code: "VALIDATION_FAILED",
        message: "Inspection report must exist before buyer summary approval",
      });
    }

    const includedIds = body.includedFindingIds;
    const buyerNote = body.buyerNote?.trim() || report.inspectorNote;

    const updatedReport = await this.dataSource.transaction(async (manager) => {
      const refreshedTask = await manager.findOne(InspectionTaskEntity, {
        where: { id: task.id, listingId },
      });
      const refreshedReport = await manager.findOne(InspectionReportEntity, {
        where: { id: report.id, listingId },
      });
      if (!refreshedTask || !refreshedReport) {
        throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Inspection report not found" });
      }

      const approvedReport = await manager.save(InspectionReportEntity, {
        ...refreshedReport,
        buyerSummaryApproved: true,
        buyerSummaryApprovedAt: new Date(),
        buyerSummaryApprovedByAdminId: adminUserId,
        buyerNote,
      });

      await manager.createQueryBuilder()
        .update(InspectionFindingEntity)
        .set({ includeInBuyerSummary: false })
        .where("report_id = :reportId", { reportId: report.id })
        .execute();

      if (includedIds?.length) {
        await manager.createQueryBuilder()
          .update(InspectionFindingEntity)
          .set({ includeInBuyerSummary: true })
          .where("report_id = :reportId", { reportId: report.id })
          .andWhere("id IN (:...ids)", { ids: includedIds })
          .execute();
      } else {
        const findings = await manager.find(InspectionFindingEntity, { where: { reportId: report.id } });
        const fallbackIds = findings.map((finding) => finding.id);
        if (fallbackIds.length > 0) {
          await manager.createQueryBuilder()
            .update(InspectionFindingEntity)
            .set({ includeInBuyerSummary: true })
            .where("report_id = :reportId", { reportId: report.id })
            .andWhere("id IN (:...ids)", { ids: fallbackIds })
            .execute();
        }
      }

      await manager.save(InspectionTaskEntity, {
        id: refreshedTask.id,
        listingId: refreshedTask.listingId,
        assignedInspectorId: refreshedTask.assignedInspectorId,
        status: "BUYER_SUMMARY_APPROVED",
        scheduledAt: refreshedTask.scheduledAt,
        completedAt: refreshedTask.completedAt,
        locationNote: refreshedTask.locationNote,
        listingSnapshot: refreshedTask.listingSnapshot,
      });

      return approvedReport;
    });

    await this.auditService.record({
      action: "inspection.summary_approve",
      actorUserId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      outcome: "success",
      correlationId,
    });
    await this.auditService.recordAdminAction({
      action: "inspection.summary_approve",
      adminId: adminUserId,
      entityType: "listing",
      entityId: listingId,
      note: buyerNote,
    });

    const updatedFindings = await this.inspectionFindingRepository.findByReportId(updatedReport.id);
    return this.toBuyerSummaryResponse(updatedReport, updatedFindings, buyerNote);
  }

  private async toTaskDto(task: InspectionTaskEntity, inspectorName: string | null) {
    const snapshot = task.listingSnapshot as unknown as ListingSnapshot;
    return {
      id: task.id,
      listingId: task.listingId,
      listingSnapshot: {
        year: snapshot.year,
        make: snapshot.make,
        model: snapshot.model,
        coverImageUrl: snapshot.coverImageStorageKey
          ? await this.storageService.getDisplayUrl(snapshot.coverImageStorageKey)
          : null,
        city: snapshot.city,
      },
      status: task.status,
      assignedInspectorId: task.assignedInspectorId,
      assignedInspectorName: inspectorName,
      scheduledAt: task.scheduledAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private async toReportDto(report: InspectionReportEntity) {
    const findings = report.findings ?? await this.inspectionFindingRepository.findByReportId(report.id);
    return {
      id: report.id,
      taskId: report.taskId,
      listingId: report.listingId,
      submittedByInspectorId: report.submittedByInspectorId,
      submittedByInspectorName: report.submittedByInspector?.fullName ?? "",
      overallScore: report.overallScore,
      roadworthy: report.roadworthy,
      inspectorNote: report.inspectorNote,
      findings: await Promise.all(findings.map(async (finding) => ({
        id: finding.id,
        category: finding.category,
        label: finding.label,
        rating: finding.rating,
        note: finding.note,
        photoUrl: finding.photoStorageKey ? await this.storageService.getDisplayUrl(finding.photoStorageKey) : null,
      }))),
      buyerSummaryApproved: report.buyerSummaryApproved,
      buyerSummaryApprovedAt: report.buyerSummaryApprovedAt?.toISOString() ?? null,
      buyerSummaryApprovedByAdminId: report.buyerSummaryApprovedByAdminId,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  private toBuyerSummaryResponse(
    report: InspectionReportEntity,
    findings: InspectionFindingEntity[],
    buyerNote: string,
  ) {
    const included = findings.filter((finding) => finding.includeInBuyerSummary || findings.every((item) => !item.includeInBuyerSummary));
    const categories = summarizeCategories(findings);
    return {
      listingId: report.listingId,
      inspectionDate: report.createdAt.toISOString(),
      inspectorName: report.submittedByInspector?.fullName ?? "",
      overallScore: report.overallScore,
      roadworthy: report.roadworthy,
      categories,
      findings: included.map((finding) => ({
        label: finding.label,
        rating: finding.rating,
        note: finding.note,
      })),
      inspectorNote: buyerNote || null,
    };
  }
}

interface ListingSnapshot {
  year: number;
  make: string;
  model: string;
  coverImageStorageKey: string | null;
  city: string;
}

function scoreFromFindings(findings: SubmitInspectionReportDto["findings"]): number {
  const total = findings.reduce((sum, finding) => sum + ratingScore(finding.rating), 0);
  return Math.round(total / findings.length);
}

function ratingScore(rating: SubmitInspectionReportDto["findings"][number]["rating"]): number {
  if (rating === "PASS") {
    return 100;
  }
  if (rating === "WATCH") {
    return 65;
  }
  return 20;
}

function summarizeCategories(findings: InspectionFindingEntity[]) {
  const groups = new Map<string, InspectionFindingEntity[]>();
  for (const finding of findings) {
    groups.set(finding.category, [...(groups.get(finding.category) ?? []), finding]);
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    score: Math.round(items.reduce((sum, item) => sum + ratingScore(item.rating), 0) / items.length),
    worstRating: items.some((item) => item.rating === "FAIL")
      ? "FAIL"
      : items.some((item) => item.rating === "WATCH")
        ? "WATCH"
        : "PASS",
    counts: {
      PASS: items.filter((item) => item.rating === "PASS").length,
      WATCH: items.filter((item) => item.rating === "WATCH").length,
      FAIL: items.filter((item) => item.rating === "FAIL").length,
    },
  }));
}
