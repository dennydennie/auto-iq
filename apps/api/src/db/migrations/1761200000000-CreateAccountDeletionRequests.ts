import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAccountDeletionRequests1761200000000 implements MigrationInterface {
  name = "CreateAccountDeletionRequests1761200000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE account_deletion_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL DEFAULT (NULLIF(current_setting('app.tenant_id', true), '')::uuid)
          REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        email text NOT NULL,
        source text NOT NULL,
        status text NOT NULL DEFAULT 'PENDING',
        reason text,
        requested_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_account_deletion_request_source
          CHECK (source IN ('MOBILE', 'PUBLIC_WEB', 'WEB')),
        CONSTRAINT chk_account_deletion_request_status
          CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_account_deletion_requests_pending_email
      ON account_deletion_requests (tenant_id, lower(email))
      WHERE status = 'PENDING'
    `);
    await queryRunner.query(`
      CREATE INDEX idx_account_deletion_requests_status_requested_at
      ON account_deletion_requests (tenant_id, status, requested_at)
    `);
    await queryRunner.query(
      "CREATE INDEX idx_account_deletion_requests_user_id ON account_deletion_requests (user_id)",
    );
    await queryRunner.query(
      "ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY",
    );
    await queryRunner.query(
      "ALTER TABLE account_deletion_requests FORCE ROW LEVEL SECURITY",
    );
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_account_deletion_requests
      ON account_deletion_requests
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS account_deletion_requests");
  }
}
