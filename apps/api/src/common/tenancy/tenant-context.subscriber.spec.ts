import { TenantContext } from "./tenant-context";
import { TenantContextSubscriber } from "./tenant-context.subscriber";

describe("TenantContextSubscriber", () => {
  it("sets tenant and user context locally inside a transaction", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const queryRunner = {
      data: {},
      isTransactionActive: true,
      query,
    } as never;
    const subscriber = new TenantContextSubscriber();

    await TenantContext.run(
      { tenantId: "11111111-1111-4111-8111-111111111111", userId: "user-1" },
      () => subscriber.beforeQuery({ queryRunner, query: "SELECT 1" } as never),
    );

    expect(query).toHaveBeenCalledWith(
      "SELECT set_config('app.tenant_id', $1, true), set_config('app.user_id', $2, true)",
      ["11111111-1111-4111-8111-111111111111", "user-1"],
    );
  });

  it("clears session context after the outer transaction ends", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const queryRunner = {
      data: {},
      isTransactionActive: false,
      query,
    } as never;
    const subscriber = new TenantContextSubscriber();

    await subscriber.afterTransactionCommit({ queryRunner } as never);

    expect(query).toHaveBeenCalledWith(
      "SELECT set_config('app.tenant_id', '', false), set_config('app.user_id', '', false)",
    );
  });
});
