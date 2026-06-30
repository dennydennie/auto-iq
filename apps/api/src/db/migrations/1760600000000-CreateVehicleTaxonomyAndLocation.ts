import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleTaxonomyAndLocation1760600000000 implements MigrationInterface {
  name = "CreateVehicleTaxonomyAndLocation1760600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vehicle_makes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL,
        name text NOT NULL,
        logo_url text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_vehicle_makes_slug UNIQUE (slug),
        CONSTRAINT uq_vehicle_makes_name UNIQUE (name)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE vehicle_models (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        make_id uuid NOT NULL REFERENCES vehicle_makes(id) ON DELETE CASCADE,
        slug text NOT NULL,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_vehicle_models_make_slug UNIQUE (make_id, slug)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_models_make_id ON vehicle_models (make_id)");

    await queryRunner.query(`
      INSERT INTO vehicle_makes (slug, name)
      VALUES
        ('toyota', 'Toyota'),
        ('honda', 'Honda'),
        ('mazda', 'Mazda'),
        ('nissan', 'Nissan')
      ON CONFLICT (slug) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO vehicle_models (make_id, slug, name)
      SELECT make.id, model.slug, model.name
      FROM vehicle_makes make
      JOIN (
        VALUES
          ('toyota', 'hilux', 'Hilux'),
          ('toyota', 'corolla', 'Corolla'),
          ('toyota', 'fortuner', 'Fortuner'),
          ('honda', 'cr-v', 'CR-V'),
          ('honda', 'civic', 'Civic'),
          ('honda', 'fit', 'Fit'),
          ('mazda', 'demio', 'Demio'),
          ('mazda', 'cx-5', 'CX-5'),
          ('mazda', 'bt-50', 'BT-50'),
          ('nissan', 'x-trail', 'X-Trail'),
          ('nissan', 'navara', 'Navara'),
          ('nissan', 'note', 'Note')
      ) AS model(make_slug, slug, name) ON model.make_slug = make.slug
      ON CONFLICT (make_id, slug) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO vehicle_makes (slug, name)
      SELECT DISTINCT
        regexp_replace(lower(trim(make)), '[^a-z0-9]+', '-', 'g') AS slug,
        trim(make) AS name
      FROM vehicle_specs
      WHERE trim(make) <> ''
      ON CONFLICT (slug) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO vehicle_models (make_id, slug, name)
      SELECT DISTINCT
        vehicle_makes.id,
        regexp_replace(lower(trim(vehicle_specs.model)), '[^a-z0-9]+', '-', 'g') AS slug,
        trim(vehicle_specs.model) AS name
      FROM vehicle_specs
      JOIN vehicle_makes
        ON vehicle_makes.slug = regexp_replace(lower(trim(vehicle_specs.make)), '[^a-z0-9]+', '-', 'g')
      WHERE trim(vehicle_specs.model) <> ''
      ON CONFLICT (make_id, slug) DO NOTHING
    `);

    await queryRunner.query("ALTER TABLE vehicle_specs ADD COLUMN make_id uuid");
    await queryRunner.query("ALTER TABLE vehicle_specs ADD COLUMN model_id uuid");
    await queryRunner.query("ALTER TABLE vehicle_specs ADD COLUMN location_latitude numeric(9,6)");
    await queryRunner.query("ALTER TABLE vehicle_specs ADD COLUMN location_longitude numeric(9,6)");
    await queryRunner.query(`
      UPDATE vehicle_specs
      SET make_id = vehicle_makes.id
      FROM vehicle_makes
      WHERE vehicle_makes.slug = regexp_replace(lower(trim(vehicle_specs.make)), '[^a-z0-9]+', '-', 'g')
    `);
    await queryRunner.query(`
      UPDATE vehicle_specs
      SET model_id = vehicle_models.id
      FROM vehicle_models
      WHERE vehicle_models.make_id = vehicle_specs.make_id
        AND vehicle_models.slug = regexp_replace(lower(trim(vehicle_specs.model)), '[^a-z0-9]+', '-', 'g')
    `);

    await queryRunner.query(`
      ALTER TABLE vehicle_specs
      ADD CONSTRAINT fk_vehicle_specs_make_id
      FOREIGN KEY (make_id) REFERENCES vehicle_makes(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE vehicle_specs
      ADD CONSTRAINT fk_vehicle_specs_model_id
      FOREIGN KEY (model_id) REFERENCES vehicle_models(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE vehicle_specs
      ADD CONSTRAINT chk_vehicle_specs_location_coordinates
      CHECK (
        (location_latitude IS NULL AND location_longitude IS NULL)
        OR (
          location_latitude BETWEEN -90 AND 90
          AND location_longitude BETWEEN -180 AND 180
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_make_id ON vehicle_specs (make_id)");
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_model_id ON vehicle_specs (model_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_specs_model_id");
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_specs_make_id");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP CONSTRAINT IF EXISTS chk_vehicle_specs_location_coordinates");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP CONSTRAINT IF EXISTS fk_vehicle_specs_model_id");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP CONSTRAINT IF EXISTS fk_vehicle_specs_make_id");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP COLUMN IF EXISTS location_longitude");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP COLUMN IF EXISTS location_latitude");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP COLUMN IF EXISTS model_id");
    await queryRunner.query("ALTER TABLE vehicle_specs DROP COLUMN IF EXISTS make_id");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_models");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_makes");
  }
}
