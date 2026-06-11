import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSellerListingsSchema1760200000000 implements MigrationInterface {
  name = "CreateSellerListingsSchema1760200000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vehicles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug text NOT NULL,
        status text NOT NULL DEFAULT 'DRAFT',
        seller_disclosure text,
        view_count integer NOT NULL DEFAULT 0,
        viewing_count integer NOT NULL DEFAULT 0,
        quote_count integer NOT NULL DEFAULT 0,
        changes_note text,
        submitted_at timestamptz,
        published_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicles_status CHECK (
          status IN (
            'DRAFT',
            'SUBMITTED',
            'INSPECTION_PENDING',
            'OWNERSHIP_VERIFICATION_PENDING',
            'CHANGES_REQUESTED',
            'APPROVED',
            'PUBLISHED',
            'RESERVED',
            'SOLD',
            'REJECTED',
            'DELISTED'
          )
        ),
        CONSTRAINT chk_vehicles_view_count CHECK (view_count >= 0),
        CONSTRAINT chk_vehicles_viewing_count CHECK (viewing_count >= 0),
        CONSTRAINT chk_vehicles_quote_count CHECK (quote_count >= 0)
      )
    `);
    await queryRunner.query("CREATE UNIQUE INDEX uq_vehicles_slug ON vehicles (slug)");
    await queryRunner.query("CREATE INDEX idx_vehicles_seller_user_id ON vehicles (seller_user_id)");
    await queryRunner.query("CREATE INDEX idx_vehicles_status ON vehicles (status)");
    await queryRunner.query(`
      CREATE INDEX idx_vehicles_review_queue
      ON vehicles (status, updated_at DESC)
      WHERE status IN (
        'SUBMITTED',
        'INSPECTION_PENDING',
        'OWNERSHIP_VERIFICATION_PENDING',
        'CHANGES_REQUESTED',
        'APPROVED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE vehicle_specs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id uuid NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        body_type text NOT NULL,
        colour text NOT NULL,
        fuel_type text NOT NULL,
        transmission text NOT NULL,
        drive_type text NOT NULL,
        engine_capacity text,
        mileage_km integer NOT NULL,
        condition text NOT NULL,
        has_accident_history boolean NOT NULL DEFAULT false,
        accident_note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_specs_year CHECK (year BETWEEN 1950 AND 2100),
        CONSTRAINT chk_vehicle_specs_body_type CHECK (
          body_type IN ('SEDAN', 'SUV', 'HATCH', 'BAKKIE', 'VAN', 'COUPE', 'WAGON')
        ),
        CONSTRAINT chk_vehicle_specs_fuel_type CHECK (
          fuel_type IN ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'OTHER')
        ),
        CONSTRAINT chk_vehicle_specs_transmission CHECK (
          transmission IN ('AUTOMATIC', 'MANUAL', 'CVT', 'DSG')
        ),
        CONSTRAINT chk_vehicle_specs_drive_type CHECK (
          drive_type IN ('FWD', 'RWD', '4WD', 'AWD')
        ),
        CONSTRAINT chk_vehicle_specs_condition CHECK (
          condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR')
        ),
        CONSTRAINT chk_vehicle_specs_mileage CHECK (mileage_km >= 0)
      )
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_specs_vehicle_id ON vehicle_specs (vehicle_id)");

    await queryRunner.query(`
      CREATE TABLE vehicle_pricing (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id uuid NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
        ask_price_usd numeric(14,2) NOT NULL,
        negotiable boolean NOT NULL DEFAULT false,
        currency text NOT NULL DEFAULT 'USD',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_pricing_price CHECK (ask_price_usd > 0),
        CONSTRAINT chk_vehicle_pricing_currency CHECK (currency = 'USD')
      )
    `);
    await queryRunner.query("CREATE INDEX idx_vehicle_pricing_vehicle_id ON vehicle_pricing (vehicle_id)");

    await queryRunner.query(`
      CREATE TABLE vehicle_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        storage_key text NOT NULL,
        slot text NOT NULL,
        content_type text NOT NULL,
        byte_size integer NOT NULL,
        is_cover boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_images_slot CHECK (
          slot IN (
            'FRONT_THREE_QUARTER',
            'REAR_THREE_QUARTER',
            'DRIVER_SIDE',
            'PASSENGER_SIDE',
            'INTERIOR_FRONT',
            'INTERIOR_REAR',
            'DASHBOARD',
            'ENGINE_BAY',
            'BOOT',
            'FRONT_LEFT_WHEEL',
            'ODOMETER',
            'VIN_PLATE'
          )
        ),
        CONSTRAINT chk_vehicle_images_byte_size CHECK (byte_size > 0)
      )
    `);
    await queryRunner.query("CREATE UNIQUE INDEX uq_vehicle_images_storage_key ON vehicle_images (storage_key)");
    await queryRunner.query("CREATE UNIQUE INDEX uq_vehicle_images_vehicle_slot ON vehicle_images (vehicle_id, slot)");
    await queryRunner.query("CREATE UNIQUE INDEX uq_vehicle_images_cover_per_vehicle ON vehicle_images (vehicle_id) WHERE is_cover");
    await queryRunner.query("CREATE INDEX idx_vehicle_images_vehicle_id ON vehicle_images (vehicle_id)");

    await queryRunner.query(`
      CREATE TABLE vehicle_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        storage_key text NOT NULL,
        document_type text NOT NULL,
        content_type text NOT NULL,
        byte_size integer NOT NULL,
        review_status text NOT NULL DEFAULT 'PENDING',
        review_note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_documents_type CHECK (
          document_type IN (
            'REGISTRATION_BOOK',
            'INSURANCE_CERTIFICATE',
            'POLICE_CLEARANCE',
            'ROADWORTHY_CERTIFICATE',
            'PURCHASE_IMPORT_DOCS',
            'SELLER_ID'
          )
        ),
        CONSTRAINT chk_vehicle_documents_review_status CHECK (
          review_status IN ('PENDING', 'APPROVED', 'REJECTED')
        ),
        CONSTRAINT chk_vehicle_documents_byte_size CHECK (byte_size > 0)
      )
    `);
    await queryRunner.query("CREATE UNIQUE INDEX uq_vehicle_documents_storage_key ON vehicle_documents (storage_key)");
    await queryRunner.query(
      "CREATE UNIQUE INDEX uq_vehicle_documents_vehicle_type ON vehicle_documents (vehicle_id, document_type)",
    );
    await queryRunner.query("CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents (vehicle_id)");

    await queryRunner.query(`
      CREATE TABLE vehicle_status_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        status text NOT NULL,
        actor_id uuid,
        actor_role text NOT NULL,
        note text,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vehicle_status_history_status CHECK (
          status IN (
            'DRAFT',
            'SUBMITTED',
            'INSPECTION_PENDING',
            'OWNERSHIP_VERIFICATION_PENDING',
            'CHANGES_REQUESTED',
            'APPROVED',
            'PUBLISHED',
            'RESERVED',
            'SOLD',
            'REJECTED',
            'DELISTED'
          )
        )
      )
    `);
    await queryRunner.query(
      "CREATE INDEX idx_vehicle_status_history_vehicle_id ON vehicle_status_history (vehicle_id, occurred_at ASC)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_status_history");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_documents");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_images");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_pricing");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_specs");
    await queryRunner.query("DROP TABLE IF EXISTS vehicles");
  }
}
