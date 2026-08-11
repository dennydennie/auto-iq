import type { MigrationInterface, QueryRunner } from "typeorm";

const INITIAL_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const SEEDS = [
  ["BODY_TYPE", "SEDAN", "Sedan"],
  ["BODY_TYPE", "SUV", "SUV"],
  ["BODY_TYPE", "HATCH", "Hatch"],
  ["BODY_TYPE", "BAKKIE", "Bakkie"],
  ["BODY_TYPE", "VAN", "Van"],
  ["BODY_TYPE", "COUPE", "Coupe"],
  ["BODY_TYPE", "WAGON", "Wagon"],
  ["FUEL_TYPE", "PETROL", "Petrol"],
  ["FUEL_TYPE", "DIESEL", "Diesel"],
  ["FUEL_TYPE", "HYBRID", "Hybrid"],
  ["FUEL_TYPE", "ELECTRIC", "Electric"],
  ["FUEL_TYPE", "OTHER", "Other"],
  ["TRANSMISSION_TYPE", "AUTOMATIC", "Automatic"],
  ["TRANSMISSION_TYPE", "MANUAL", "Manual"],
  ["TRANSMISSION_TYPE", "CVT", "CVT"],
  ["TRANSMISSION_TYPE", "DSG", "DSG"],
  ["DRIVE_TYPE", "FWD", "Front-wheel drive"],
  ["DRIVE_TYPE", "RWD", "Rear-wheel drive"],
  ["DRIVE_TYPE", "4WD", "Four-wheel drive"],
  ["DRIVE_TYPE", "AWD", "All-wheel drive"],
  ["CONDITION_GRADE", "EXCELLENT", "Excellent"],
  ["CONDITION_GRADE", "GOOD", "Good"],
  ["CONDITION_GRADE", "FAIR", "Fair"],
  ["CONDITION_GRADE", "POOR", "Poor"],
] as const;

export class CreateReferenceCatalogue1761100000000 implements MigrationInterface {
  name = "CreateReferenceCatalogue1761100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reference_options (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL DEFAULT '${INITIAL_TENANT_ID}' REFERENCES tenants(id),
        category text NOT NULL,
        code text NOT NULL,
        label text NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_reference_options_category CHECK (
          category IN ('BODY_TYPE', 'FUEL_TYPE', 'TRANSMISSION_TYPE', 'DRIVE_TYPE', 'CONDITION_GRADE')
        ),
        CONSTRAINT chk_reference_options_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_]{0,79}$'),
        CONSTRAINT chk_reference_options_label CHECK (length(btrim(label)) BETWEEN 1 AND 120),
        CONSTRAINT chk_reference_options_sort_order CHECK (sort_order >= 0),
        CONSTRAINT uq_reference_options_tenant_category_code UNIQUE (tenant_id, category, code)
      )
    `);
    await queryRunner.query(
      "ALTER TABLE reference_options ALTER COLUMN tenant_id SET DEFAULT (NULLIF(current_setting('app.tenant_id', true), '')::uuid)",
    );
    await queryRunner.query(
      "CREATE INDEX idx_reference_options_active_catalogue ON reference_options (tenant_id, category, active, sort_order, label)",
    );
    await this.seed(queryRunner);
    await queryRunner.query("ALTER TABLE reference_options ENABLE ROW LEVEL SECURITY");
    await queryRunner.query("ALTER TABLE reference_options FORCE ROW LEVEL SECURITY");
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_reference_options ON reference_options
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    `);
    await this.replaceStaticChecks(queryRunner);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TRIGGER IF EXISTS trg_validate_vehicle_reference_options ON vehicle_specs");
    await queryRunner.query("DROP FUNCTION IF EXISTS validate_vehicle_reference_options()");
    await queryRunner.query("DROP TABLE IF EXISTS reference_options");
  }

  private async seed(queryRunner: QueryRunner): Promise<void> {
    for (const [index, seed] of SEEDS.entries()) {
      await queryRunner.query(
        `INSERT INTO reference_options (tenant_id, category, code, label, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [INITIAL_TENANT_ID, seed[0], seed[1], seed[2], index],
      );
    }
  }

  private async replaceStaticChecks(queryRunner: QueryRunner): Promise<void> {
    for (const constraint of [
      "chk_vehicle_specs_body_type",
      "chk_vehicle_specs_fuel_type",
      "chk_vehicle_specs_transmission",
      "chk_vehicle_specs_drive_type",
      "chk_vehicle_specs_condition",
    ]) {
      await queryRunner.query(`ALTER TABLE vehicle_specs DROP CONSTRAINT IF EXISTS ${constraint}`);
    }
    await queryRunner.query(`
      CREATE FUNCTION validate_vehicle_reference_options() RETURNS trigger AS $$
      DECLARE invalid_field text;
      BEGIN
        SELECT candidate.field INTO invalid_field
        FROM (VALUES
          ('body_type', 'BODY_TYPE', NEW.body_type),
          ('fuel_type', 'FUEL_TYPE', NEW.fuel_type),
          ('transmission', 'TRANSMISSION_TYPE', NEW.transmission),
          ('drive_type', 'DRIVE_TYPE', NEW.drive_type),
          ('condition', 'CONDITION_GRADE', NEW.condition)
        ) AS candidate(field, category, code)
        WHERE NOT EXISTS (
          SELECT 1 FROM reference_options option
          WHERE option.tenant_id = NEW.tenant_id
            AND option.category = candidate.category
            AND option.code = candidate.code
            AND option.active
        )
        LIMIT 1;
        IF invalid_field IS NOT NULL THEN
          RAISE EXCEPTION 'Inactive or unknown vehicle reference option: %', invalid_field
            USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_validate_vehicle_reference_options
      BEFORE INSERT OR UPDATE OF body_type, fuel_type, transmission, drive_type, condition
      ON vehicle_specs FOR EACH ROW EXECUTE FUNCTION validate_vehicle_reference_options()
    `);
  }
}
