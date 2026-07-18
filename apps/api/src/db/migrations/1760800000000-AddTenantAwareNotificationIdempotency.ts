import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantAwareNotificationIdempotency1760800000000 implements MigrationInterface {
  name = "AddTenantAwareNotificationIdempotency1760800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS uq_notifications_idempotency");
    await queryRunner.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT uq_notifications_tenant_idempotency
      UNIQUE (tenant_id, recipient_user_id, channel, idempotency_key)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS uq_notifications_tenant_idempotency");
    await queryRunner.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT uq_notifications_idempotency
      UNIQUE (recipient_user_id, channel, idempotency_key)
    `);
  }
}
