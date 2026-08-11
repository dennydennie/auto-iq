import { ConflictException, NotFoundException } from "@nestjs/common";
import { AdminUsersService } from "./admin-users.service";

const createdAt = new Date("2026-08-01T10:00:00.000Z");

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-2",
    full_name: "Buyer One",
    email: "buyer@example.com",
    phone: "+263771234567",
    city: "Harare",
    role: "BUYER",
    account_status: "ACTIVE",
    access_active: true,
    email_verified: true,
    phone_verified: false,
    created_at: createdAt,
    ...overrides,
  };
}

function createService() {
  const auditService = {
    record: jest.fn().mockResolvedValue(undefined),
    recordAdminAction: jest.fn().mockResolvedValue(undefined),
  };
  const manager = { query: jest.fn() };
  const dataSource = {
    query: jest.fn(),
    transaction: jest.fn(async (callback) => callback(manager)),
  };
  return {
    auditService,
    dataSource,
    manager,
    service: new AdminUsersService(auditService as never, dataSource as never),
  };
}

describe("AdminUsersService", () => {
  it("returns a paginated tenant user list", async () => {
    const { dataSource, service } = createService();
    dataSource.query
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([userRow()]);

    const result = await service.list({ search: "buyer", page: 1, limit: 20 });

    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(result.data[0]).toMatchObject({
      id: "user-2",
      fullName: "Buyer One",
      accessActive: true,
    });
    expect(dataSource.query.mock.calls[1][1]).toEqual(["%buyer%", 20, 0]);
  });

  it("prevents an admin from suspending their own access", async () => {
    const { service } = createService();

    await expect(
      service.updateAccess("admin-1", undefined, "admin-1", { active: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("prevents suspension of the last active tenant admin", async () => {
    const { manager, service } = createService();
    manager.query
      .mockResolvedValueOnce([userRow({ id: "admin-2", role: "ADMIN" })])
      .mockResolvedValueOnce([{ total: 1 }]);

    await expect(
      service.updateAccess("admin-1", undefined, "admin-2", { active: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("updates access and records the admin action", async () => {
    const { auditService, dataSource, manager, service } = createService();
    manager.query
      .mockResolvedValueOnce([userRow()])
      .mockResolvedValueOnce([]);
    dataSource.query.mockResolvedValueOnce([userRow({ access_active: false })]);

    const result = await service.updateAccess(
      "admin-1",
      "correlation-1",
      "user-2",
      { active: false },
    );

    expect(result.accessActive).toBe(false);
    expect(auditService.recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: "user-2", note: "Tenant access suspended" }),
    );
  });

  it("hides users outside the tenant as not found", async () => {
    const { manager, service } = createService();
    manager.query.mockResolvedValueOnce([]);

    await expect(
      service.updateAccess("admin-1", undefined, "foreign-user", { active: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
