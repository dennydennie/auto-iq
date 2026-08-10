import { InspectionsService } from "./inspections.service";

function completeFindings() {
  return [
    { category: "ENGINE" as const, label: "Engine", rating: "PASS" as const },
    { category: "ELECTRICAL" as const, label: "Electrical", rating: "PASS" as const },
    { category: "BODY" as const, label: "Body", rating: "WATCH" as const },
    { category: "TYRES" as const, label: "Tyres", rating: "PASS" as const },
    { category: "BRAKES" as const, label: "Brakes", rating: "PASS" as const },
    { category: "INTERIOR" as const, label: "Interior", rating: "PASS" as const },
  ];
}

describe("InspectionsService", () => {
  it("assignTask creates a scheduled task for inspector assignment", async () => {
    const userRepository = {
      findProfileById: jest.fn().mockResolvedValue({
        id: "inspector-1",
        fullName: "Inspector One",
        status: "ACTIVE",
        email: "inspector@example.com",
        phone: "+263771000001",
        roles: [{ role: "INSPECTOR" }],
      }),
      findByRole: jest.fn().mockResolvedValue([]),
    };

    const notificationService = { notifyUser: jest.fn() };

    const storageService = {
      getDisplayUrl: jest.fn().mockResolvedValue("https://storage.local/cover.jpg"),
    };

    const manager = {
      findOne: jest.fn()
        .mockResolvedValueOnce({
          id: "listing-1",
          status: "SUBMITTED",
          specs: { year: 2021, make: "Toyota", model: "Hilux" },
          seller: { city: "Harare" },
          images: [{ isCover: true, storageKey: "listing-1/cover.jpg" }],
        })
        .mockResolvedValueOnce(null),
      save: jest.fn().mockImplementation(async (entity: unknown, payload?: { id?: string }) => {
        const value = payload ?? (entity as { id?: string });
        return {
          id: value.id ?? "task-1",
          createdAt: new Date("2026-06-09T08:00:00.000Z"),
          updatedAt: new Date("2026-06-09T08:00:00.000Z"),
          ...value,
        };
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (callback: (value: any) => Promise<any>) => callback(manager)),
    };

    const vehicleStatusHistoryRepository = {
      create: jest.fn().mockImplementation((payload) => payload),
    };

    const service = new InspectionsService(
      { record: jest.fn(), recordAdminAction: jest.fn() } as never,
      dataSource as never,
      { findByReportId: jest.fn() } as never,
      { findByTaskId: jest.fn(), findByListingId: jest.fn() } as never,
      { findByListingId: jest.fn() } as never,
      notificationService as never,
      storageService as never,
      userRepository as never,
      vehicleStatusHistoryRepository as never,
    );

    const assigned = await service.assignTask(
      "admin-1",
      "corr-1",
      "listing-1",
      {
        inspectorId: "inspector-1",
        scheduledAt: "2099-06-09T09:00:00.000Z",
        locationNote: "Lot A",
      },
    );

    expect(assigned.status).toBe("SCHEDULED");
    expect(userRepository.findProfileById).toHaveBeenCalledWith("inspector-1");
    expect(vehicleStatusHistoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      status: "INSPECTION_PENDING",
      actorId: "admin-1",
      actorRole: "ADMIN",
    }));
    expect(manager.findOne).toHaveBeenCalledTimes(2);
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "INSPECTION_ASSIGNED",
        userId: "inspector-1",
      }),
    );
  });

  it("rejects inspection report submissions that are not in an editable state", async () => {
    const service = new InspectionsService(
      { record: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findByIdForInspector: jest.fn().mockResolvedValue({
          id: "task-1",
          status: "BUYER_SUMMARY_APPROVED",
        }),
      } as never,
      { notifyUser: jest.fn() } as never,
      { getDisplayUrl: jest.fn() } as never,
      { findProfileById: jest.fn(), findByRole: jest.fn() } as never,
      {} as never,
    );

    await expect(
      service.submitReport("inspector-1", undefined, "task-1", {
        findings: [
          {
            category: "ENGINE",
            label: "No noise",
            rating: "PASS",
            note: "Clean",
            photoStorageKey: "photo-1",
          },
        ],
        inspectorNote: "Looks good",
        roadworthy: true,
      }),
    ).rejects.toThrow("Cannot submit inspection report from BUYER_SUMMARY_APPROVED");
  });

  it("does not reassign an inspection after report submission", async () => {
    const manager = {
      findOne: jest.fn()
        .mockResolvedValueOnce({
          id: "listing-1",
          status: "INSPECTION_PENDING",
          specs: { year: 2021, make: "Toyota", model: "Hilux" },
          seller: { city: "Harare" },
          images: [],
        })
        .mockResolvedValueOnce({ id: "task-1", status: "REPORT_SUBMITTED" }),
      save: jest.fn(),
    };
    const service = new InspectionsService(
      {} as never,
      { transaction: jest.fn(async (callback) => callback(manager)) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findProfileById: jest.fn().mockResolvedValue({
          id: "inspector-1",
          status: "ACTIVE",
          roles: [{ role: "INSPECTOR" }],
        }),
      } as never,
      {} as never,
    );

    await expect(service.assignTask("admin-1", undefined, "listing-1", {
      inspectorId: "inspector-1",
      scheduledAt: "2099-06-09T09:00:00.000Z",
    })).rejects.toThrow("Cannot reassign an inspection from REPORT_SUBMITTED");
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("requires every buyer-relevant inspection category", async () => {
    const storageService = {
      inspectPendingInspectionUpload: jest.fn(),
    };
    const service = new InspectionsService(
      { record: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findByIdForInspector: jest.fn().mockResolvedValue({
          id: "task-1",
          listingId: "listing-1",
          status: "SCHEDULED",
        }),
      } as never,
      { notifyUser: jest.fn() } as never,
      storageService as never,
      { findByRole: jest.fn() } as never,
      {} as never,
    );

    await expect(
      service.submitReport("inspector-1", undefined, "task-1", {
        findings: [
          { category: "ENGINE", label: "Engine", rating: "PASS" },
        ],
        inspectorNote: "Only the engine was checked",
        roadworthy: true,
      }),
    ).rejects.toThrow(
      "Inspection findings missing categories: ELECTRICAL, BODY, TYRES, BRAKES, INTERIOR",
    );
    expect(storageService.inspectPendingInspectionUpload).not.toHaveBeenCalled();
  });

  it("rejects blank finding labels before claiming evidence", async () => {
    const storageService = { inspectPendingInspectionUpload: jest.fn() };
    const service = new InspectionsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findByIdForInspector: jest.fn().mockResolvedValue({
          id: "task-1",
          listingId: "listing-1",
          status: "SCHEDULED",
        }),
      } as never,
      {} as never,
      storageService as never,
      {} as never,
      {} as never,
    );
    const findings = completeFindings();
    findings[0].label = "   ";

    await expect(service.submitReport("inspector-1", undefined, "task-1", {
      findings,
      inspectorNote: "Complete inspection",
      roadworthy: true,
    })).rejects.toThrow("Inspection finding labels must contain visible text");
    expect(storageService.inspectPendingInspectionUpload).not.toHaveBeenCalled();
  });

  it("scopes finding-photo presigns to the assigned inspector task", async () => {
    const storageService = {
      presignInspectionPhoto: jest.fn().mockResolvedValue({
        uploadUrl: "https://storage.example/upload",
        storageKey: "inspection-reports/photo.jpg",
      }),
    };
    const service = new InspectionsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        findByIdForInspector: jest.fn().mockResolvedValue({
          id: "task-1",
          listingId: "listing-1",
          status: "SCHEDULED",
        }),
      } as never,
      {} as never,
      storageService as never,
      {} as never,
      {} as never,
    );

    await service.presignFindingPhoto("inspector-1", "task-1", {
      contentType: "image/jpeg",
      contentLength: 1024,
    });

    expect(storageService.presignInspectionPhoto).toHaveBeenCalledWith(
      "inspector-1",
      "listing-1",
      "task-1",
      "image/jpeg",
      1024,
    );
  });

  it("submits a complete report, computes its score, and alerts admins", async () => {
    const now = new Date("2026-08-10T10:00:00.000Z");
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (_entity, value) => ({
        id: value.id ?? "report-1",
        createdAt: now,
        updatedAt: now,
        ...value,
      })),
      delete: jest.fn(),
      update: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const inspectionReportRepository = {
      findByTaskId: jest.fn().mockResolvedValue({
        id: "report-1",
        taskId: "task-1",
        listingId: "listing-1",
        submittedByInspectorId: "inspector-1",
        submittedByInspector: { fullName: "Inspector One" },
        overallScore: 94,
        roadworthy: true,
        inspectorNote: "Safe with minor body wear.",
        findings: [],
        buyerSummaryApproved: false,
        buyerSummaryApprovedAt: null,
        buyerSummaryApprovedByAdminId: null,
        createdAt: now,
        updatedAt: now,
      }),
    };
    const notificationService = { notifyUser: jest.fn() };
    const service = new InspectionsService(
      { record: jest.fn() } as never,
      dataSource as never,
      { findByReportId: jest.fn() } as never,
      inspectionReportRepository as never,
      {
        findByIdForInspector: jest.fn().mockResolvedValue({
          id: "task-1",
          listingId: "listing-1",
          status: "SCHEDULED",
        }),
      } as never,
      notificationService as never,
      {
        inspectPendingInspectionUpload: jest.fn(),
        completePendingUpload: jest.fn(),
        releasePendingUploadClaim: jest.fn(),
      } as never,
      {
        findByRole: jest.fn().mockResolvedValue([{ id: "admin-1", email: "admin@example.com", phone: "" }]),
      } as never,
      {} as never,
    );

    await service.submitReport("inspector-1", "corr-1", "task-1", {
      findings: completeFindings(),
      inspectorNote: "Safe with minor body wear.",
      roadworthy: true,
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ overallScore: 94 }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      { id: "task-1" },
      expect.objectContaining({ status: "REPORT_SUBMITTED" }),
    );
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({ template: "INSPECTION_COMPLETE", userId: "admin-1" }),
    );
  });
});
