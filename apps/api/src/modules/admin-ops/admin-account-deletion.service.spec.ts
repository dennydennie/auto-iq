import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { AdminAccountDeletionService } from "./admin-account-deletion.service";

const requestedAt = new Date("2026-08-10T09:00:00.000Z");

function deletionRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "deletion-1",
    email: "buyer@example.com",
    source: "MOBILE",
    status: "PENDING",
    reason: "No longer needed",
    identityVerified: false,
    dataHandlingConfirmed: false,
    processingNote: null,
    processedByUserId: null,
    processedBy: null,
    requestedAt,
    processedAt: null,
    ...overrides,
  };
}

function fixture() {
  const auditService = {
    record: jest.fn().mockResolvedValue(undefined),
    recordAdminAction: jest.fn().mockResolvedValue(undefined),
  };
  const deletionRequests = {
    findAdminPage: jest
      .fn()
      .mockResolvedValue([[deletionRequest()], 1]),
    findForAdmin: jest.fn().mockResolvedValue(deletionRequest()),
    processPending: jest.fn().mockImplementation(
      async (_id: string, values: Record<string, unknown>) =>
        deletionRequest({
          ...values,
          processedBy: { id: "admin-1", fullName: "Admin User" },
        }),
    ),
  };
  return {
    auditService,
    deletionRequests,
    service: new AdminAccountDeletionService(
      auditService as never,
      deletionRequests as never,
    ),
  };
}

describe("AdminAccountDeletionService", () => {
  it("returns a paginated operational queue", async () => {
    const { deletionRequests, service } = fixture();

    const result = await service.list({
      page: 1,
      limit: 20,
      status: "PENDING",
      search: " buyer@example.com ",
    });

    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0]).toMatchObject({
      id: "deletion-1",
      email: "buyer@example.com",
      status: "PENDING",
    });
    expect(deletionRequests.findAdminPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: "PENDING",
      search: "buyer@example.com",
    });
  });

  it("completes an attested deletion request and records audit evidence", async () => {
    const { auditService, deletionRequests, service } = fixture();

    const result = await service.process(
      "admin-1",
      "correlation-1",
      "deletion-1",
      {
        status: "COMPLETED",
        identityVerified: true,
        dataHandlingConfirmed: true,
        note: " Identity checked; deletion and retention review completed. ",
      },
    );

    expect(result.status).toBe("COMPLETED");
    expect(deletionRequests.processPending).toHaveBeenCalledWith(
      "deletion-1",
      expect.objectContaining({
        status: "COMPLETED",
        identityVerified: true,
        dataHandlingConfirmed: true,
        processingNote:
          "Identity checked; deletion and retention review completed.",
      }),
    );
    expect(auditService.recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "account.deletion_completed",
        entityId: "deletion-1",
      }),
    );
  });

  it("rejects completion without both operator attestations", async () => {
    const { deletionRequests, service } = fixture();

    await expect(
      service.process("admin-1", undefined, "deletion-1", {
        status: "COMPLETED",
        identityVerified: true,
        dataHandlingConfirmed: false,
        note: "Identity checked but data handling is incomplete.",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(deletionRequests.processPending).not.toHaveBeenCalled();
  });

  it("cancels a request with an audited reason", async () => {
    const { service } = fixture();

    const result = await service.process(
      "admin-1",
      undefined,
      "deletion-1",
      {
        status: "CANCELLED",
        identityVerified: false,
        dataHandlingConfirmed: false,
        note: "Requester withdrew the deletion request.",
      },
    );

    expect(result.status).toBe("CANCELLED");
  });

  it("rejects a request that another operator already processed", async () => {
    const { deletionRequests, service } = fixture();
    deletionRequests.findForAdmin.mockResolvedValue(
      deletionRequest({ status: "COMPLETED" }),
    );

    await expect(
      service.process("admin-1", undefined, "deletion-1", {
        status: "CANCELLED",
        identityVerified: false,
        dataHandlingConfirmed: false,
        note: "Duplicate request already handled elsewhere.",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("hides requests outside the tenant as not found", async () => {
    const { deletionRequests, service } = fixture();
    deletionRequests.findForAdmin.mockResolvedValue(null);

    await expect(
      service.process("admin-1", undefined, "foreign-request", {
        status: "CANCELLED",
        identityVerified: false,
        dataHandlingConfirmed: false,
        note: "Request is not present in this tenant.",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
