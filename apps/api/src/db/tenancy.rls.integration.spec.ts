import { randomUUID } from "node:crypto";
import { Client } from "pg";

const runIntegration = process.env.RUN_RLS_INTEGRATION === "true";

(runIntegration ? describe : describe.skip)("tenant RLS integration", () => {
  it("denies reads across tenant contexts", async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    const marker = `rls-test-${randomUUID()}`;
    await client.connect();
    try {
      await cleanupRole(client);
      await client.query("CREATE ROLE rls_test NOLOGIN NOSUPERUSER NOBYPASSRLS");
      await client.query("GRANT USAGE ON SCHEMA public TO rls_test");
      await client.query("GRANT SELECT, INSERT, DELETE ON audit_logs TO rls_test");
      await client.query("GRANT SELECT, INSERT ON tenants TO rls_test");
      await client.query("SET ROLE rls_test");
      await client.query("INSERT INTO tenants (id, slug, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [
        "22222222-2222-4222-8222-222222222222",
        "rls-test",
        "RLS test tenant",
      ]);
      await client.query("SELECT set_config('app.tenant_id', $1, false)", [
        "11111111-1111-4111-8111-111111111111",
      ]);
      await client.query(
        "INSERT INTO audit_logs (action, entity_type, entity_id, outcome, correlation_id, tenant_id) VALUES ($1, 'test', 'test', 'success', $2, $3)",
        ["rls.integration", marker, "11111111-1111-4111-8111-111111111111"],
      );
      await client.query("SELECT set_config('app.tenant_id', $1, false)", [
        "22222222-2222-4222-8222-222222222222",
      ]);
      const hidden = await client.query("SELECT id FROM audit_logs WHERE correlation_id = $1", [marker]);
      expect(hidden.rowCount).toBe(0);

      await client.query("SELECT set_config('app.tenant_id', $1, false)", [
        "11111111-1111-4111-8111-111111111111",
      ]);
      const visible = await client.query("SELECT id FROM audit_logs WHERE correlation_id = $1", [marker]);
      expect(visible.rowCount).toBe(1);
      await client.query("DELETE FROM audit_logs WHERE correlation_id = $1", [marker]);
    } finally {
      await client.query("RESET ROLE").catch(() => undefined);
      await cleanupRole(client);
      await client.end();
    }
  });
});

async function cleanupRole(client: Client): Promise<void> {
  await client.query("DROP OWNED BY rls_test").catch(() => undefined);
  await client.query("DROP ROLE IF EXISTS rls_test");
}
