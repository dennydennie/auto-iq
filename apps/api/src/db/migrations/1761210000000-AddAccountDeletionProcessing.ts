import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountDeletionProcessing1761210000000
  implements MigrationInterface
{
  name = "AddAccountDeletionProcessing1761210000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Historical decisions predate operator evidence. NOT VALID preserves
    // those rows while enforcing both checks for every new or changed row.
    await queryRunner.query(`
      ALTER TABLE account_deletion_requests
        ADD COLUMN identity_verified boolean NOT NULL DEFAULT false,
        ADD COLUMN data_handling_confirmed boolean NOT NULL DEFAULT false,
        ADD COLUMN processing_note text,
        ADD COLUMN processed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN processed_at timestamptz,
        ADD CONSTRAINT chk_account_deletion_processing_state CHECK (
          (
            status = 'PENDING'
            AND processed_by_user_id IS NULL
            AND processed_at IS NULL
          )
          OR
          (
            status IN ('COMPLETED', 'CANCELLED')
            AND processed_at IS NOT NULL
          )
        ) NOT VALID,
        ADD CONSTRAINT chk_account_deletion_completion_attestation CHECK (
          status <> 'COMPLETED'
          OR (identity_verified = true AND data_handling_confirmed = true)
        ) NOT VALID
    `);
    await queryRunner.query(`
      CREATE INDEX idx_account_deletion_requests_processed_by_user_id
      ON account_deletion_requests (processed_by_user_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS idx_account_deletion_requests_processed_by_user_id",
    );
    await queryRunner.query(`
      ALTER TABLE account_deletion_requests
        DROP CONSTRAINT IF EXISTS chk_account_deletion_completion_attestation,
        DROP CONSTRAINT IF EXISTS chk_account_deletion_processing_state,
        DROP COLUMN IF EXISTS processed_at,
        DROP COLUMN IF EXISTS processed_by_user_id,
        DROP COLUMN IF EXISTS processing_note,
        DROP COLUMN IF EXISTS data_handling_confirmed,
        DROP COLUMN IF EXISTS identity_verified
    `);
  }
}
