import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasskeyCredentials1761700000000 implements MigrationInterface {
  name = "CreatePasskeyCredentials1761700000000";

  async up(runner: QueryRunner) {
    await runner.query(`CREATE TABLE passkey_credentials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      credential_id text NOT NULL UNIQUE, public_key bytea NOT NULL,
      counter bigint NOT NULL DEFAULT 0 CHECK (counter >= 0),
      transports jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(transports) = 'array'),
      backed_up boolean NOT NULL DEFAULT false, label text CHECK (length(label) <= 80),
      last_used_at timestamptz, revoked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await runner.query("CREATE INDEX idx_passkeys_owner ON passkey_credentials (tenant_id, user_id)");
    await runner.query("CREATE INDEX idx_passkeys_user ON passkey_credentials (user_id)");
    await this.policy(runner);
  }

  private async policy(runner: QueryRunner) {
    await runner.query("ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY");
    await runner.query("ALTER TABLE passkey_credentials FORCE ROW LEVEL SECURITY");
    await runner.query(`CREATE POLICY passkey_owner ON passkey_credentials
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)`);
  }

  async down(runner: QueryRunner) {
    await runner.query("DROP TABLE passkey_credentials");
  }
}
