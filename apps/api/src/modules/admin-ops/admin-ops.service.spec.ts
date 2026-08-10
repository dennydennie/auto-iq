import { VehicleEntity } from "../../db/entity/vehicle.entity";
import { ListingStateService } from "../listings/listing-state.service";
import { AdminOpsService } from "./admin-ops.service";

function createHarness(options?: {
  ownershipStatus?: string;
  buyerSummaryApproved?: boolean;
}) {
  const auditService = {
    record: jest.fn(),
    recordAdminAction: jest.fn(),
  };
  const manager = {
    findOne: jest
      .fn()
      .mockResolvedValue({ id: "listing-1", status: "APPROVED" }),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const dataSource = {
    transaction: jest.fn(
      async (callback: (value: typeof manager) => Promise<void>) =>
        callback(manager),
    ),
  };
  const inspectionReportRepository = {
    findByListingId: jest.fn().mockResolvedValue({
      buyerSummaryApproved: options?.buyerSummaryApproved ?? true,
    }),
  };
  const ownershipVerificationRepository = {
    findByListingId: jest.fn().mockResolvedValue({
      status: options?.ownershipStatus ?? "APPROVED",
    }),
  };
  const vehicleRepository = {
    findAdminById: jest.fn().mockResolvedValue({
      id: "listing-1",
      status: "APPROVED",
      sellerDisclosure: "Full service history with no known issues.",
    }),
  };
  const listingWizardValidator = { validateForSubmit: jest.fn() };
  const historyRepository = {
    create: jest.fn().mockImplementation((value) => value),
  };
  const service = new AdminOpsService(
    auditService as never,
    dataSource as never,
    inspectionReportRepository as never,
    {} as never,
    new ListingStateService(),
    listingWizardValidator as never,
    {} as never,
    ownershipVerificationRepository as never,
    {} as never,
    {} as never,
    vehicleRepository as never,
    {} as never,
    historyRepository as never,
    {} as never,
  );
  Object.defineProperty(service, "toAdminListingDto", {
    value: jest.fn().mockResolvedValue({
      id: "listing-1",
      status: "PUBLISHED",
    }),
  });
  return {
    auditService,
    dataSource,
    historyRepository,
    listingWizardValidator,
    manager,
    service,
  };
}

describe("AdminOpsService publishing", () => {
  it("rechecks trust gates immediately before publishing", async () => {
    const { dataSource, service } = createHarness({
      ownershipStatus: "IN_REVIEW",
    });

    await expect(
      service.publish("admin-1", "corr-1", "listing-1"),
    ).rejects.toThrow("Ownership verification must be approved");
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it("publishes explicitly and records history and audit evidence", async () => {
    const {
      auditService,
      historyRepository,
      listingWizardValidator,
      manager,
      service,
    } = createHarness();

    await service.publish("admin-1", "corr-1", "listing-1");

    expect(listingWizardValidator.validateForSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "listing-1" }),
      "Full service history with no known issues.",
    );
    expect(manager.save).toHaveBeenCalledWith(
      VehicleEntity,
      expect.objectContaining({
        status: "PUBLISHED",
        publishedAt: expect.any(Date),
      }),
    );
    expect(historyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PUBLISHED", actorRole: "ADMIN" }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "listing.publish",
        correlationId: "corr-1",
      }),
    );
    expect(auditService.recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "listing.publish",
        adminId: "admin-1",
      }),
    );
  });
});
