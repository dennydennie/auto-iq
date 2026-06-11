import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminOpsSchema1760300000000 implements MigrationInterface {
  name = "CreateAdminOpsSchema1760300000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE vehicles ADD COLUMN admin_notes text");

    await queryRunner.query(`
      CREATE TABLE ownership_verifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id uuid NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'NOT_STARTED',
        reviewer_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
        note text,
        reviewed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_ownership_verifications_status CHECK (
          status IN ('NOT_STARTED', 'IN_REVIEW', 'APPROVED', 'NEEDS_CLARIFICATION', 'REJECTED')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_ownership_verifications_listing_id ON ownership_verifications (listing_id)");
    await queryRunner.query("CREATE INDEX idx_ownership_verifications_status ON ownership_verifications (status)");

    await queryRunner.query(`
      CREATE TABLE inspection_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id uuid NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
        assigned_inspector_id uuid REFERENCES users(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'UNASSIGNED',
        scheduled_at timestamptz,
        completed_at timestamptz,
        location_note text,
        listing_snapshot jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_inspection_tasks_status CHECK (
          status IN ('UNASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_SUBMITTED', 'BUYER_SUMMARY_APPROVED')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_inspection_tasks_listing_id ON inspection_tasks (listing_id)");
    await queryRunner.query("CREATE INDEX idx_inspection_tasks_assigned_inspector_id ON inspection_tasks (assigned_inspector_id)");
    await queryRunner.query("CREATE INDEX idx_inspection_tasks_status ON inspection_tasks (status)");

    await queryRunner.query(`
      CREATE TABLE inspection_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL UNIQUE REFERENCES inspection_tasks(id) ON DELETE CASCADE,
        listing_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        submitted_by_inspector_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        overall_score integer NOT NULL,
        roadworthy boolean NOT NULL,
        inspector_note text NOT NULL,
        buyer_note text,
        buyer_summary_approved boolean NOT NULL DEFAULT false,
        buyer_summary_approved_at timestamptz,
        buyer_summary_approved_by_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_inspection_reports_score CHECK (overall_score BETWEEN 0 AND 100)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_inspection_reports_listing_id ON inspection_reports (listing_id)");

    await queryRunner.query(`
      CREATE TABLE inspection_findings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id uuid NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
        category text NOT NULL,
        label text NOT NULL,
        rating text NOT NULL,
        note text,
        photo_storage_key text,
        include_in_buyer_summary boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_inspection_findings_category CHECK (
          category IN ('ENGINE', 'ELECTRICAL', 'BODY', 'TYRES', 'BRAKES', 'INTERIOR', 'SUMMARY')
        ),
        CONSTRAINT chk_inspection_findings_rating CHECK (
          rating IN ('PASS', 'WATCH', 'FAIL')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_inspection_findings_report_id ON inspection_findings (report_id)");

    await queryRunner.query(`
      CREATE TABLE admin_action_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        note text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX idx_admin_action_logs_admin_id ON admin_action_logs (admin_id)");
    await queryRunner.query("CREATE INDEX idx_admin_action_logs_created_at ON admin_action_logs (created_at)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS admin_action_logs");
    await queryRunner.query("DROP TABLE IF EXISTS inspection_findings");
    await queryRunner.query("DROP TABLE IF EXISTS inspection_reports");
    await queryRunner.query("DROP TABLE IF EXISTS inspection_tasks");
    await queryRunner.query("DROP TABLE IF EXISTS ownership_verifications");
    await queryRunner.query("ALTER TABLE vehicles DROP COLUMN IF EXISTS admin_notes");
  }
}
