import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBuyerMarketplaceSchema1760400000000 implements MigrationInterface {
  name = "CreateBuyerMarketplaceSchema1760400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE saved_vehicles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_saved_vehicles_buyer_listing UNIQUE (buyer_user_id, listing_id)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_saved_vehicles_buyer_user_id ON saved_vehicles (buyer_user_id)");
    await queryRunner.query("CREATE INDEX idx_saved_vehicles_listing_id ON saved_vehicles (listing_id)");

    await queryRunner.query(`
      CREATE TABLE quote_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        offer_price_usd numeric(14,2) NOT NULL,
        ask_price_usd numeric(14,2) NOT NULL,
        payment_plan text NOT NULL,
        message text,
        status text NOT NULL DEFAULT 'NEW',
        counter_price_usd numeric(14,2),
        response_note text,
        responded_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_quote_requests_offer_price_usd CHECK (offer_price_usd > 0),
        CONSTRAINT chk_quote_requests_status CHECK (
          status IN ('NEW', 'UNDER_REVIEW', 'ACCEPTED', 'COUNTERED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'CANCELLED')
        ),
        CONSTRAINT chk_quote_requests_payment_plan CHECK (
          payment_plan IN ('FULL_CASH', 'BANK_TRANSFER', 'OTHER')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_quote_requests_listing_id ON quote_requests (listing_id)");
    await queryRunner.query("CREATE INDEX idx_quote_requests_buyer_user_id ON quote_requests (buyer_user_id)");
    await queryRunner.query("CREATE INDEX idx_quote_requests_status ON quote_requests (status)");

    await queryRunner.query(`
      CREATE TABLE vehicle_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        max_budget_cents integer NOT NULL,
        make_id text,
        model text,
        year_min integer,
        year_max integer,
        body_type_id text,
        fuel_type_id text,
        transmission_type_id text,
        max_odometer_km integer,
        urgency text NOT NULL,
        notes text,
        status text NOT NULL DEFAULT 'NEW',
        admin_note text,
        matched_listing_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_requests_max_budget_cents CHECK (max_budget_cents > 0),
        CONSTRAINT chk_vehicle_requests_year_range CHECK (
          year_min IS NULL OR year_max IS NULL OR year_min <= year_max
        ),
        CONSTRAINT chk_vehicle_requests_status CHECK (
          status IN ('NEW', 'ACKNOWLEDGED', 'SOURCING', 'MATCH_FOUND', 'NO_MATCH', 'CANCELLED')
        ),
        CONSTRAINT chk_vehicle_requests_urgency CHECK (
          urgency IN ('ASAP', 'ONE_MONTH', 'BROWSING')
        )
      )
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_requests_buyer_user_id ON vehicle_requests (buyer_user_id)");
    await queryRunner.query("CREATE INDEX idx_vehicle_requests_status ON vehicle_requests (status)");
    await queryRunner.query("CREATE INDEX idx_vehicle_requests_urgency ON vehicle_requests (urgency)");

    await queryRunner.query(`
      CREATE INDEX idx_vehicles_catalogue_published
      ON vehicles (published_at DESC, id)
      WHERE status = 'PUBLISHED'
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_catalogue_make_model_year ON vehicle_specs (make, model, year)");
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_catalogue_body_type ON vehicle_specs (body_type)");
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_catalogue_mileage ON vehicle_specs (mileage_km)");
    await queryRunner.query("CREATE INDEX idx_vehicle_pricing_catalogue_price ON vehicle_pricing (ask_price_usd)");
    await queryRunner.query("CREATE INDEX idx_users_catalogue_city ON users (city)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_pricing_catalogue_price");
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_specs_catalogue_mileage");
    await queryRunner.query("DROP INDEX IF EXISTS idx_users_catalogue_city");
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_specs_catalogue_body_type");
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicle_specs_catalogue_make_model_year");
    await queryRunner.query("DROP INDEX IF EXISTS idx_vehicles_catalogue_published");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_requests");
    await queryRunner.query("DROP TABLE IF EXISTS quote_requests");
    await queryRunner.query("DROP TABLE IF EXISTS saved_vehicles");
  }
}
