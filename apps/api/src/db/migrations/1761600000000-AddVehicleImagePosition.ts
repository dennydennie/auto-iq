import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleImagePosition1761600000000 implements MigrationInterface {
  name = "AddVehicleImagePosition1761600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE vehicle_images ADD COLUMN position smallint",
    );
    await queryRunner.query(`
      WITH ordered AS (
        SELECT id, row_number() OVER (
          PARTITION BY vehicle_id ORDER BY created_at, id
        ) - 1 AS position
        FROM vehicle_images
      )
      UPDATE vehicle_images AS image
      SET position = ordered.position
      FROM ordered
      WHERE image.id = ordered.id
    `);
    await queryRunner.query(
      "ALTER TABLE vehicle_images ALTER COLUMN position SET NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE vehicle_images ADD CONSTRAINT chk_vehicle_images_position CHECK (position >= 0 AND position <= 11)",
    );
    await queryRunner.query(
      "CREATE INDEX idx_vehicle_images_vehicle_position ON vehicle_images (vehicle_id, position)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS idx_vehicle_images_vehicle_position",
    );
    await queryRunner.query(
      "ALTER TABLE vehicle_images DROP CONSTRAINT IF EXISTS chk_vehicle_images_position",
    );
    await queryRunner.query("ALTER TABLE vehicle_images DROP COLUMN position");
  }
}
