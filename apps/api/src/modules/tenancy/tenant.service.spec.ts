import { TenantService } from "./tenant.service";
import { TenantContext } from "../../common/tenancy/tenant-context";

describe("TenantService", () => {
  it("requires membership for an explicitly selected tenant", async () => {
    const memberships = { findOne: jest.fn().mockResolvedValue({ tenantId: "tenant-2" }) };
    const service = new TenantService(
      { getOrThrow: jest.fn().mockReturnValue("tenant-1") } as never,
      memberships as never,
    );

    await expect(service.resolve("user-1", "11111111-1111-4111-8111-111111111111")).resolves.toBe("11111111-1111-4111-8111-111111111111");
    expect(memberships.findOne).toHaveBeenCalledWith({
      where: { userId: "user-1", tenantId: "11111111-1111-4111-8111-111111111111", active: true },
    });
  });

  it("denies a user without membership", async () => {
    const service = new TenantService(
      { getOrThrow: jest.fn().mockReturnValue("11111111-1111-4111-8111-111111111111") } as never,
      { findOne: jest.fn().mockResolvedValue(null) } as never,
    );

    await expect(service.resolve("user-1", "22222222-2222-4222-8222-222222222222")).rejects.toMatchObject({
      response: expect.objectContaining({ code: "TENANT_ACCESS_DENIED" }),
    });
  });

  it("runs background work inside each tenant context", async () => {
    const tenants = {
      find: jest.fn().mockResolvedValue([
        { id: "11111111-1111-4111-8111-111111111111" },
        { id: "22222222-2222-4222-8222-222222222222" },
      ]),
    };
    const seen: string[] = [];
    const service = new TenantService(
      { getOrThrow: jest.fn() } as never,
      { findOne: jest.fn() } as never,
      tenants as never,
    );

    await service.forEachTenant(async (tenantId) => {
      seen.push(`${tenantId}:${TenantContext.current()?.tenantId}`);
    });

    expect(seen).toEqual([
      "11111111-1111-4111-8111-111111111111:11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222:22222222-2222-4222-8222-222222222222",
    ]);
  });
});
