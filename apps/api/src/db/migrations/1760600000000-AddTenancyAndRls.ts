import type { MigrationInterface, QueryRunner } from "typeorm";

const INITIAL_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const TENANT_TABLES = [
  "buyer_profiles",
  "seller_profiles",
  "audit_logs",
  "admin_action_logs",
  "approved_viewing_locations",
  "vehicles",
  "vehicle_specs",
  "vehicle_pricing",
  "vehicle_images",
  "vehicle_documents",
  "vehicle_status_history",
  "ownership_verifications",
  "inspection_tasks",
  "inspection_reports",
  "inspection_findings",
  "saved_vehicles",
  "quote_requests",
  "vehicle_requests",
  "viewing_appointments",
  "viewing_participants",
  "notifications",
  "notification_attempts",
] as const;

export class AddTenancyAndRls1760600000000 implements MigrationInterface {
  name = "AddTenancyAndRls1760600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tenants (
        id uuid PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `INSERT INTO tenants (id, slug, name) VALUES ('${INITIAL_TENANT_ID}', 'default', 'Auto IQ')`,
    );
    await queryRunner.query(`
      CREATE TABLE tenant_memberships (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role text NOT NULL,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_tenant_memberships_user_tenant UNIQUE (user_id, tenant_id),
        CONSTRAINT chk_tenant_memberships_role CHECK (role IN ('BUYER', 'SELLER', 'INSPECTOR', 'ADMIN'))
      )
    `);
    await queryRunner.query(`
      INSERT INTO tenant_memberships (tenant_id, user_id, role)
      SELECT '${INITIAL_TENANT_ID}', user_id, role FROM user_roles
      ON CONFLICT (user_id, tenant_id) DO NOTHING
    `);
    await queryRunner.query("CREATE INDEX idx_tenant_memberships_user_id ON tenant_memberships (user_id)");
    await queryRunner.query("CREATE INDEX idx_tenant_memberships_tenant_id ON tenant_memberships (tenant_id)");
    await queryRunner.query("ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY");
    await queryRunner.query("ALTER TABLE tenant_memberships FORCE ROW LEVEL SECURITY");
    await queryRunner.query(`
      CREATE POLICY tenant_membership_user_scope ON tenant_memberships
      USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
    `);

    for (const table of TENANT_TABLES) {
      await this.addTenantColumn(queryRunner, table);
      await this.enableTenantRls(queryRunner, table);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...TENANT_TABLES].reverse()) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_tenant_id`);
      await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_tenant_id`);
      await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS tenant_id`);
    }
    await queryRunner.query("DROP POLICY IF EXISTS tenant_membership_user_scope ON tenant_memberships");
    await queryRunner.query("ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY");
    await queryRunner.query("DROP TABLE IF EXISTS tenant_memberships");
    await queryRunner.query("DROP TABLE IF EXISTS tenants");
  }

  private async addTenantColumn(queryRunner: QueryRunner, table: string): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ${table}
      ADD COLUMN tenant_id uuid NOT NULL DEFAULT '${INITIAL_TENANT_ID}'
    `);
    await queryRunner.query(`
      ALTER TABLE ${table}
      ALTER COLUMN tenant_id SET DEFAULT (NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    `);
    await queryRunner.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT fk_${table}_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    `);
    await queryRunner.query(`CREATE INDEX idx_${table}_tenant_id ON ${table} (tenant_id)`);
  }

  private async enableTenantRls(queryRunner: QueryRunner, table: string): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_${table} ON ${table}
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    `);
  }
}
