import type { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendBuyerProfile1760520000000 implements MigrationInterface {
  name = "ExtendBuyerProfile1760520000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE buyer_profiles
        ADD COLUMN vehicle_purpose text,
        ADD COLUMN search_radius_km integer,
        ADD COLUMN delivery_preference text,
        ADD COLUMN payment_preference text,
        ADD COLUMN preferred_fuel_types text[] NOT NULL DEFAULT '{}',
        ADD COLUMN preferred_transmissions text[] NOT NULL DEFAULT '{}',
        ADD COLUMN min_seats smallint,
        ADD COLUMN max_mileage_km integer,
        ADD COLUMN year_min smallint,
        ADD COLUMN year_max smallint,
        ADD CONSTRAINT chk_buyer_vehicle_purpose
          CHECK (vehicle_purpose IS NULL OR vehicle_purpose IN ('PERSONAL', 'FAMILY', 'BUSINESS', 'RIDE_HAILING', 'DELIVERY', 'OTHER')),
        ADD CONSTRAINT chk_buyer_search_radius
          CHECK (search_radius_km IS NULL OR (search_radius_km >= 1 AND search_radius_km <= 1000)),
        ADD CONSTRAINT chk_buyer_delivery_preference
          CHECK (delivery_preference IS NULL OR delivery_preference IN ('PICKUP', 'DELIVERY', 'EITHER')),
        ADD CONSTRAINT chk_buyer_payment_preference
          CHECK (payment_preference IS NULL OR payment_preference IN ('CASH', 'FINANCE', 'EITHER')),
        ADD CONSTRAINT chk_buyer_min_seats
          CHECK (min_seats IS NULL OR (min_seats >= 1 AND min_seats <= 100)),
        ADD CONSTRAINT chk_buyer_max_mileage
          CHECK (max_mileage_km IS NULL OR max_mileage_km >= 0),
        ADD CONSTRAINT chk_buyer_years
          CHECK (
            (year_min IS NULL OR (year_min >= 1886 AND year_min <= 2200))
            AND (year_max IS NULL OR (year_max >= 1886 AND year_max <= 2200))
            AND (year_min IS NULL OR year_max IS NULL OR year_min <= year_max)
          )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE buyer_profiles
        DROP CONSTRAINT chk_buyer_years,
        DROP CONSTRAINT chk_buyer_max_mileage,
        DROP CONSTRAINT chk_buyer_min_seats,
        DROP CONSTRAINT chk_buyer_payment_preference,
        DROP CONSTRAINT chk_buyer_delivery_preference,
        DROP CONSTRAINT chk_buyer_search_radius,
        DROP CONSTRAINT chk_buyer_vehicle_purpose,
        DROP COLUMN year_max,
        DROP COLUMN year_min,
        DROP COLUMN max_mileage_km,
        DROP COLUMN min_seats,
        DROP COLUMN preferred_transmissions,
        DROP COLUMN preferred_fuel_types,
        DROP COLUMN payment_preference,
        DROP COLUMN delivery_preference,
        DROP COLUMN search_radius_km,
        DROP COLUMN vehicle_purpose
    `);
  }
}
