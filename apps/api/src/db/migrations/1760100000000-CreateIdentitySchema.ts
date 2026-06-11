import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIdentitySchema1760100000000 implements MigrationInterface {
  name = "CreateIdentitySchema1760100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name text NOT NULL,
        email text NOT NULL,
        phone text NOT NULL,
        password_hash text NOT NULL,
        status text NOT NULL DEFAULT 'PENDING_VERIFICATION',
        city text NOT NULL,
        phone_verified boolean NOT NULL DEFAULT false,
        email_verified boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_users_status
          CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'))
      )
    `);
    await queryRunner.query("CREATE UNIQUE INDEX uq_users_email ON users (lower(email))");
    await queryRunner.query("CREATE UNIQUE INDEX uq_users_phone ON users (phone)");

    await queryRunner.query(`
      CREATE TABLE user_roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_user_roles_role
          CHECK (role IN ('BUYER', 'SELLER', 'INSPECTOR', 'ADMIN'))
      )
    `);
    await queryRunner.query("CREATE UNIQUE INDEX uq_user_roles_user_role ON user_roles (user_id, role)");
    await queryRunner.query("CREATE INDEX idx_user_roles_user_id ON user_roles (user_id)");

    await queryRunner.query(`
      CREATE TABLE buyer_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        city text NOT NULL,
        preferred_body_types text[] NOT NULL DEFAULT '{}',
        preferred_makes text[] NOT NULL DEFAULT '{}',
        budget_min numeric(14,2),
        budget_max numeric(14,2),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_buyer_budget_order
          CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_buyer_profiles_user_id ON buyer_profiles (user_id)");

    await queryRunner.query(`
      CREATE TABLE seller_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        business_name text,
        city text NOT NULL,
        consents_complete boolean NOT NULL DEFAULT false,
        verified boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX idx_seller_profiles_user_id ON seller_profiles (user_id)");

    await queryRunner.query(`
      CREATE TABLE user_consents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type text NOT NULL,
        version text NOT NULL,
        accepted_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_user_consents_type
          CHECK (consent_type IN ('TERMS', 'PRIVACY', 'SELLER_RULES', 'BUYER_RULES', 'NO_SIDE_DEAL'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_user_consents_user_type_version
      ON user_consents (user_id, consent_type, version)
    `);
    await queryRunner.query("CREATE INDEX idx_user_consents_user_id ON user_consents (user_id)");

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id uuid,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text,
        outcome text NOT NULL,
        correlation_id text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs (actor_user_id)");
    await queryRunner.query("CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS audit_logs");
    await queryRunner.query("DROP TABLE IF EXISTS user_consents");
    await queryRunner.query("DROP TABLE IF EXISTS seller_profiles");
    await queryRunner.query("DROP TABLE IF EXISTS buyer_profiles");
    await queryRunner.query("DROP TABLE IF EXISTS user_roles");
    await queryRunner.query("DROP TABLE IF EXISTS users");
  }
}
