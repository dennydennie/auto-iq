import { InspectionsService } from "./inspections.service";

describe("InspectionsService", () => {
  it("assignTask creates a scheduled task for inspector assignment", async () => {
    const userRepository = {
      findProfileById: jest.fn().mockResolvedValue({
        id: "inspector-1",
        fullName: "Inspector One",
        roles: [{ role: "INSPECTOR" }],
      }),
    };

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
        scheduledAt: "2026-06-09T09:00:00.000Z",
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
      { getDisplayUrl: jest.fn() } as never,
      { findProfileById: jest.fn() } as never,
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
});
