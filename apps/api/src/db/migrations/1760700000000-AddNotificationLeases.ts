import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationLeases1760700000000 implements MigrationInterface {
  name = "AddNotificationLeases1760700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE notifications ADD COLUMN claim_token text");
    await queryRunner.query("ALTER TABLE notifications ADD COLUMN claim_expires_at timestamptz");
    await queryRunner.query(
      "CREATE INDEX idx_notifications_retry_claim ON notifications (status, retry_after, claim_expires_at)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS idx_notifications_retry_claim");
    await queryRunner.query("ALTER TABLE notifications DROP COLUMN IF EXISTS claim_expires_at");
    await queryRunner.query("ALTER TABLE notifications DROP COLUMN IF EXISTS claim_token");
  }
}
