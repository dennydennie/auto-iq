import type { MigrationInterface, QueryRunner } from "typeorm";

export class TenantScopeMembershipAccess1761000000000
  implements MigrationInterface
{
  name = "TenantScopeMembershipAccess1761000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP POLICY IF EXISTS tenant_membership_user_scope ON tenant_memberships",
    );
    await queryRunner.query(`
      CREATE POLICY tenant_membership_tenant_scope ON tenant_memberships
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP POLICY IF EXISTS tenant_membership_tenant_scope ON tenant_memberships",
    );
    await queryRunner.query(`
      CREATE POLICY tenant_membership_user_scope ON tenant_memberships
      USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
    `);
  }
}
