import type { MigrationInterface, QueryRunner } from "typeorm";

const CHECK_CONSTRAINTS = [
  [
    "chk_buyer_vehicle_purpose",
    "vehicle_purpose IS NULL OR vehicle_purpose IN ('PERSONAL', 'FAMILY', 'BUSINESS', 'RIDE_HAILING', 'DELIVERY', 'OTHER')",
  ],
  [
    "chk_buyer_search_radius",
    "search_radius_km IS NULL OR (search_radius_km >= 1 AND search_radius_km <= 1000)",
  ],
  [
    "chk_buyer_delivery_preference",
    "delivery_preference IS NULL OR delivery_preference IN ('PICKUP', 'DELIVERY', 'EITHER')",
  ],
  [
    "chk_buyer_payment_preference",
    "payment_preference IS NULL OR payment_preference IN ('CASH', 'FINANCE', 'EITHER')",
  ],
  [
    "chk_buyer_preferred_fuel_types",
    "preferred_fuel_types <@ ARRAY['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'OTHER']::text[]",
  ],
  [
    "chk_buyer_preferred_transmissions",
    "preferred_transmissions <@ ARRAY['AUTOMATIC', 'MANUAL', 'CVT', 'DSG']::text[]",
  ],
  [
    "chk_buyer_min_seats",
    "min_seats IS NULL OR (min_seats >= 1 AND min_seats <= 100)",
  ],
  ["chk_buyer_max_mileage", "max_mileage_km IS NULL OR max_mileage_km >= 0"],
  [
    "chk_buyer_years",
    `(year_min IS NULL OR (year_min >= 1886 AND year_min <= 2200))
      AND (year_max IS NULL OR (year_max >= 1886 AND year_max <= 2200))
      AND (year_min IS NULL OR year_max IS NULL OR year_min <= year_max)`,
  ],
] as const;

export class ExtendBuyerProfile1760900000000 implements MigrationInterface {
  name = "ExtendBuyerProfile1760900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await addColumns(queryRunner);
    for (const constraint of CHECK_CONSTRAINTS) {
      await addConstraintIfMissing(queryRunner, constraint[0], constraint[1]);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE buyer_profiles
        DROP CONSTRAINT IF EXISTS chk_buyer_years,
        DROP CONSTRAINT IF EXISTS chk_buyer_max_mileage,
        DROP CONSTRAINT IF EXISTS chk_buyer_min_seats,
        DROP CONSTRAINT IF EXISTS chk_buyer_preferred_transmissions,
        DROP CONSTRAINT IF EXISTS chk_buyer_preferred_fuel_types,
        DROP CONSTRAINT IF EXISTS chk_buyer_payment_preference,
        DROP CONSTRAINT IF EXISTS chk_buyer_delivery_preference,
        DROP CONSTRAINT IF EXISTS chk_buyer_search_radius,
        DROP CONSTRAINT IF EXISTS chk_buyer_vehicle_purpose,
        DROP COLUMN IF EXISTS year_max,
        DROP COLUMN IF EXISTS year_min,
        DROP COLUMN IF EXISTS max_mileage_km,
        DROP COLUMN IF EXISTS min_seats,
        DROP COLUMN IF EXISTS preferred_transmissions,
        DROP COLUMN IF EXISTS preferred_fuel_types,
        DROP COLUMN IF EXISTS payment_preference,
        DROP COLUMN IF EXISTS delivery_preference,
        DROP COLUMN IF EXISTS search_radius_km,
        DROP COLUMN IF EXISTS vehicle_purpose
    `);
  }
}

async function addColumns(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE buyer_profiles
      ADD COLUMN IF NOT EXISTS vehicle_purpose text,
      ADD COLUMN IF NOT EXISTS search_radius_km integer,
      ADD COLUMN IF NOT EXISTS delivery_preference text,
      ADD COLUMN IF NOT EXISTS payment_preference text,
      ADD COLUMN IF NOT EXISTS preferred_fuel_types text[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS preferred_transmissions text[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS min_seats smallint,
      ADD COLUMN IF NOT EXISTS max_mileage_km integer,
      ADD COLUMN IF NOT EXISTS year_min smallint,
      ADD COLUMN IF NOT EXISTS year_max smallint
  `);
}

async function addConstraintIfMissing(
  queryRunner: QueryRunner,
  name: string,
  expression: string,
): Promise<void> {
  const existing: unknown[] = await queryRunner.query(
    `SELECT 1 FROM pg_constraint
     WHERE conrelid = 'buyer_profiles'::regclass AND conname = $1`,
    [name],
  );
  if (existing.length > 0) return;
  await queryRunner.query(
    `ALTER TABLE buyer_profiles ADD CONSTRAINT ${name} CHECK (${expression})`,
  );
}
