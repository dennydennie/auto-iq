import { NotFoundException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { AccountDeletionService } from "./account-deletion.service";

function fixture() {
  const auditService = { record: jest.fn() };
  const deletionRequests = {
    create: jest.fn((value) => ({ id: "request-1", ...value })),
    findPendingByEmail: jest.fn().mockResolvedValue(null),
    findPendingByUser: jest.fn().mockResolvedValue(null),
    save: jest.fn((value) => Promise.resolve(value)),
  };
  const rateLimitService = { consume: jest.fn() };
  const users = {
    findByEmail: jest.fn().mockResolvedValue({ id: "user-1" }),
    findById: jest.fn().mockResolvedValue({
      id: "user-1",
      email: "buyer@example.com",
    }),
  };
  const service = new AccountDeletionService(
    auditService as never,
    deletionRequests as never,
    rateLimitService as never,
    users as never,
  );
  return { auditService, deletionRequests, rateLimitService, service, users };
}

describe("AccountDeletionService", () => {
  it("records an authenticated request without accepting client identity data", async () => {
    const { deletionRequests, service } = fixture();

    await expect(
      service.requestAuthenticated("user-1", {
        client: "MOBILE",
        reason: "  No longer needed  ",
      }),
    ).resolves.toEqual({ accepted: true });

    expect(deletionRequests.create).toHaveBeenCalledWith({
      email: "buyer@example.com",
      reason: "No longer needed",
      source: "MOBILE",
      status: "PENDING",
      userId: "user-1",
    });
  });

  it("deduplicates pending authenticated requests", async () => {
    const { deletionRequests, service } = fixture();
    deletionRequests.findPendingByUser.mockResolvedValue({ id: "pending" });

    await service.requestAuthenticated("user-1", { client: "WEB" });

    expect(deletionRequests.save).not.toHaveBeenCalled();
  });

  it("accepts simultaneous requests that race on the pending constraint", async () => {
    const { auditService, deletionRequests, service } = fixture();
    deletionRequests.save.mockRejectedValueOnce(pendingRequestConflict());

    await expect(
      service.requestAuthenticated("user-1", { client: "MOBILE" }),
    ).resolves.toEqual({ accepted: true });

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it("accepts public requests without revealing whether the account exists", async () => {
    const { deletionRequests, rateLimitService, service, users } = fixture();

    await expect(
      service.requestPublic(
        { email: " Buyer@Example.com ", reason: "  Please remove it " },
        "203.0.113.5",
      ),
    ).resolves.toEqual({ accepted: true });

    expect(rateLimitService.consume).toHaveBeenCalledWith(
      expect.stringMatching(/^account-deletion:[a-f0-9]{64}$/),
      3,
      86400,
    );
    expect(deletionRequests.create).toHaveBeenCalledWith({
      email: "buyer@example.com",
      reason: "Please remove it",
      source: "PUBLIC_WEB",
      status: "PENDING",
      userId: null,
    });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it("rejects an authenticated request when the user is missing", async () => {
    const { service, users } = fixture();
    users.findById.mockResolvedValue(null);

    await expect(
      service.requestAuthenticated("missing", { client: "WEB" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function pendingRequestConflict() {
  const driverError = Object.assign(new Error("duplicate"), {
    code: "23505",
    constraint: "uq_account_deletion_requests_pending_email",
  });
  return new QueryFailedError("INSERT", [], driverError);
}
