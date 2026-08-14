import type { MigrationInterface, QueryRunner } from "typeorm";

export class AllowMultipleTenantRoles1761400000000 implements MigrationInterface {
  name = "AllowMultipleTenantRoles1761400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenant_memberships
      DROP CONSTRAINT uq_tenant_memberships_user_tenant
    `);
    await queryRunner.query(`
      ALTER TABLE tenant_memberships
      ADD CONSTRAINT uq_tenant_memberships_user_tenant_role
      UNIQUE (user_id, tenant_id, role)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY",
    );
    await queryRunner.query(`
      WITH ranked_memberships AS (
        SELECT id,
          row_number() OVER (
            PARTITION BY user_id, tenant_id
            ORDER BY CASE role
              WHEN 'ADMIN' THEN 1
              WHEN 'SELLER' THEN 2
              WHEN 'BUYER' THEN 3
              ELSE 4
            END, created_at
          ) AS position
        FROM tenant_memberships
      )
      DELETE FROM tenant_memberships membership
      USING ranked_memberships ranked
      WHERE membership.id = ranked.id AND ranked.position > 1
    `);
    await queryRunner.query(`
      ALTER TABLE tenant_memberships
      DROP CONSTRAINT uq_tenant_memberships_user_tenant_role
    `);
    await queryRunner.query(`
      ALTER TABLE tenant_memberships
      ADD CONSTRAINT uq_tenant_memberships_user_tenant
      UNIQUE (user_id, tenant_id)
    `);
    await queryRunner.query(
      "ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY",
    );
    await queryRunner.query(
      "ALTER TABLE tenant_memberships FORCE ROW LEVEL SECURITY",
    );
  }
}
