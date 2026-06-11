import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewingNotificationSchema1760500000000 implements MigrationInterface {
  name = "CreateViewingNotificationSchema1760500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE approved_viewing_locations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        address_line_1 text NOT NULL,
        address_line_2 text,
        city text NOT NULL,
        latitude numeric(9,6),
        longitude numeric(9,6),
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX idx_approved_viewing_locations_active ON approved_viewing_locations (active)");

    await queryRunner.query(`
      INSERT INTO approved_viewing_locations (name, address_line_1, city, latitude, longitude, active)
      VALUES
        ('Belvedere Viewing Hub', '12 Samora Machel Avenue', 'Harare', -17.824858, 31.053028, true),
        ('Borrowdale Secure Yard', '48 Borrowdale Road', 'Harare', -17.783333, 31.100000, true)
    `);

    await queryRunner.query(`
      CREATE TABLE viewing_appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'REQUESTED',
        preferred_slot timestamptz NOT NULL,
        confirmed_slot timestamptz,
        location_id uuid NOT NULL REFERENCES approved_viewing_locations(id) ON DELETE RESTRICT,
        listing_snapshot jsonb NOT NULL,
        note text,
        outcome_note text,
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_viewing_appointments_status CHECK (
          status IN ('REQUESTED', 'PENDING_SELLER_CONFIRMATION', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_viewing_appointments_listing_id ON viewing_appointments (listing_id)");
    await queryRunner.query("CREATE INDEX idx_viewing_appointments_buyer_user_id ON viewing_appointments (buyer_user_id)");
    await queryRunner.query("CREATE INDEX idx_viewing_appointments_seller_user_id ON viewing_appointments (seller_user_id)");
    await queryRunner.query("CREATE INDEX idx_viewing_appointments_status ON viewing_appointments (status)");
    await queryRunner.query("CREATE INDEX idx_viewing_appointments_confirmed_slot ON viewing_appointments (confirmed_slot)");

    await queryRunner.query(`
      CREATE TABLE viewing_participants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        viewing_id uuid NOT NULL REFERENCES viewing_appointments(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role text NOT NULL,
        confirmed boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_viewing_participants_role CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
        CONSTRAINT uq_viewing_participant UNIQUE (viewing_id, user_id, role)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_viewing_participants_viewing_id ON viewing_participants (viewing_id)");

    await queryRunner.query(`
      CREATE TABLE notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel text NOT NULL,
        template text NOT NULL,
        idempotency_key text NOT NULL,
        status text NOT NULL DEFAULT 'QUEUED',
        recipient_address text NOT NULL,
        payload jsonb NOT NULL,
        attempt_count integer NOT NULL DEFAULT 0,
        last_attempt_at timestamptz,
        retry_after timestamptz,
        provider_ref text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_notifications_channel CHECK (channel IN ('EMAIL', 'SMS', 'WHATSAPP')),
        CONSTRAINT chk_notifications_status CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'DEAD_LETTER')),
        CONSTRAINT uq_notifications_idempotency UNIQUE (recipient_user_id, channel, idempotency_key)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_notifications_status ON notifications (status)");
    await queryRunner.query("CREATE INDEX idx_notifications_retry_after ON notifications (retry_after)");
    await queryRunner.query("CREATE INDEX idx_notifications_recipient_user_id ON notifications (recipient_user_id)");

    await queryRunner.query(`
      CREATE TABLE notification_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        attempt_number integer NOT NULL,
        status text NOT NULL,
        provider_ref text,
        sent_at timestamptz,
        error_message text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_notification_attempts_status CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'DEAD_LETTER'))
      )
    `);
    await queryRunner.query("CREATE INDEX idx_notification_attempts_notification_id ON notification_attempts (notification_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS notification_attempts");
    await queryRunner.query("DROP TABLE IF EXISTS notifications");
    await queryRunner.query("DROP TABLE IF EXISTS viewing_participants");
    await queryRunner.query("DROP TABLE IF EXISTS viewing_appointments");
    await queryRunner.query("DROP TABLE IF EXISTS approved_viewing_locations");
  }
}
