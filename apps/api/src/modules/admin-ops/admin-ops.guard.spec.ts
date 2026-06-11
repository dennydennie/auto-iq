import { AdminOpsGuard } from "./admin-ops.guard";

describe("AdminOpsGuard", () => {
  const guard = new AdminOpsGuard();

  it("allows admins", () => {
    expect(guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => ({ currentUser: { roles: ["ADMIN"] } }),
      }),
    } as never)).toBe(true);
  });

  it("rejects non-admins", () => {
    expect(() => guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => ({ currentUser: { roles: ["SELLER"] } }),
      }),
    } as never)).toThrow("Admin access is required");
  });
});
