import type { MigrationInterface, QueryRunner } from "typeorm";

const MAKE_SEEDS = [
  {
    code: "toyota",
    name: "Toyota",
    models: [
      "Hilux",
      "Corolla",
      "Fortuner",
      "Land Cruiser",
      "Land Cruiser Prado",
      "RAV4",
      "Harrier",
      "Aqua",
      "Vitz",
      "Passo",
      "Premio",
      "Allion",
      "Axio",
      "Fielder",
      "Wish",
      "Sienta",
      "Noah",
      "Voxy",
      "Hiace",
      "Probox",
      "Rush",
      "C-HR",
      "Camry",
      "Crown",
      "Raum",
    ],
  },
  {
    code: "honda",
    name: "Honda",
    models: [
      "Vezel",
      "Fit",
      "CR-V",
      "Civic",
      "Accord",
      "Grace",
      "Shuttle",
      "Freed",
      "Insight",
      "Stepwgn",
      "Odyssey",
      "N-Box",
      "HR-V",
      "BR-V",
    ],
  },
  {
    code: "mazda",
    name: "Mazda",
    models: [
      "Demio",
      "Mazda2",
      "Axela",
      "Mazda3",
      "Atenza",
      "Mazda6",
      "CX-3",
      "CX-5",
      "CX-30",
      "CX-8",
      "CX-9",
      "BT-50",
      "Bongo",
    ],
  },
  {
    code: "nissan",
    name: "Nissan",
    models: [
      "Note",
      "X-Trail",
      "Navara",
      "NP200",
      "NP300",
      "Juke",
      "Qashqai",
      "Tiida",
      "March",
      "Serena",
      "AD Van",
      "Patrol",
      "Elgrand",
      "Dualis",
      "Sylphy",
      "Skyline",
      "Caravan",
    ],
  },
  {
    code: "isuzu",
    name: "Isuzu",
    models: ["D-Max", "KB", "MU-X", "N-Series", "Trooper", "Como"],
  },
  {
    code: "ford",
    name: "Ford",
    models: [
      "Ranger",
      "Everest",
      "EcoSport",
      "Territory",
      "Focus",
      "Fiesta",
      "Kuga",
      "Escape",
      "Transit",
      "Tourneo",
      "Mustang",
      "Figo",
    ],
  },
  {
    code: "mercedes-benz",
    name: "Mercedes-Benz",
    models: [
      "A-Class",
      "B-Class",
      "C-Class",
      "E-Class",
      "S-Class",
      "CLA",
      "GLA",
      "GLB",
      "GLC",
      "GLE",
      "GLS",
      "ML-Class",
      "Vito",
      "Sprinter",
    ],
  },
  {
    code: "bmw",
    name: "BMW",
    models: [
      "1 Series",
      "2 Series",
      "3 Series",
      "4 Series",
      "5 Series",
      "7 Series",
      "X1",
      "X2",
      "X3",
      "X5",
      "X6",
      "X7",
    ],
  },
  {
    code: "volkswagen",
    name: "Volkswagen",
    models: [
      "Polo",
      "Polo Vivo",
      "Golf",
      "Tiguan",
      "T-Cross",
      "T-Roc",
      "Amarok",
      "Touareg",
      "Caddy",
      "Transporter",
      "Passat",
      "Jetta",
    ],
  },
  {
    code: "suzuki",
    name: "Suzuki",
    models: [
      "Alto",
      "S-Presso",
      "Swift",
      "Baleno",
      "Dzire",
      "Celerio",
      "Ignis",
      "Jimny",
      "Vitara",
      "Grand Vitara",
      "Ertiga",
      "Fronx",
    ],
  },
  {
    code: "mitsubishi",
    name: "Mitsubishi",
    models: [
      "Pajero",
      "Pajero Sport",
      "Triton",
      "Outlander",
      "ASX",
      "Eclipse Cross",
      "Delica",
      "Lancer",
      "Colt",
      "Mirage",
      "Canter",
    ],
  },
  {
    code: "subaru",
    name: "Subaru",
    models: [
      "Forester",
      "Impreza",
      "XV",
      "Crosstrek",
      "Outback",
      "Legacy",
      "Levorg",
      "WRX",
      "BRZ",
      "Exiga",
    ],
  },
  {
    code: "hyundai",
    name: "Hyundai",
    models: [
      "Tucson",
      "Santa Fe",
      "Creta",
      "Venue",
      "Kona",
      "i10",
      "Grand i10",
      "i20",
      "i30",
      "Elantra",
      "Accent",
      "H-1",
    ],
  },
  {
    code: "kia",
    name: "Kia",
    models: [
      "Sportage",
      "Sorento",
      "Seltos",
      "Sonet",
      "Picanto",
      "Rio",
      "Cerato",
      "Carnival",
      "Soul",
      "K2700",
      "K2500",
    ],
  },
  {
    code: "chevrolet",
    name: "Chevrolet",
    models: [
      "Trailblazer",
      "Cruze",
      "Spark",
      "Aveo",
      "Captiva",
      "Utility",
      "Orlando",
      "Sonic",
      "Lumina",
    ],
  },
  {
    code: "land-rover",
    name: "Land Rover",
    models: [
      "Range Rover",
      "Range Rover Sport",
      "Range Rover Evoque",
      "Range Rover Velar",
      "Discovery",
      "Discovery Sport",
      "Defender",
      "Freelander",
    ],
  },
  {
    code: "jeep",
    name: "Jeep",
    models: [
      "Wrangler",
      "Grand Cherokee",
      "Cherokee",
      "Compass",
      "Renegade",
      "Gladiator",
      "Patriot",
    ],
  },
  {
    code: "audi",
    name: "Audi",
    models: [
      "A1",
      "A3",
      "A4",
      "A5",
      "A6",
      "A7",
      "A8",
      "Q2",
      "Q3",
      "Q5",
      "Q7",
      "Q8",
    ],
  },
  {
    code: "lexus",
    name: "Lexus",
    models: ["IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "CT", "RC"],
  },
  {
    code: "renault",
    name: "Renault",
    models: [
      "Kwid",
      "Clio",
      "Sandero",
      "Duster",
      "Captur",
      "Koleos",
      "Triber",
      "Megane",
    ],
  },
  {
    code: "peugeot",
    name: "Peugeot",
    models: [
      "108",
      "208",
      "308",
      "508",
      "2008",
      "3008",
      "5008",
      "Partner",
      "Landtrek",
    ],
  },
  {
    code: "volvo",
    name: "Volvo",
    models: ["V40", "S60", "S90", "XC40", "XC60", "XC90", "V60", "V90"],
  },
  {
    code: "mahindra",
    name: "Mahindra",
    models: [
      "KUV100",
      "XUV300",
      "XUV500",
      "XUV700",
      "Scorpio",
      "Pik Up",
      "Thar",
    ],
  },
  {
    code: "chery",
    name: "Chery",
    models: [
      "QQ3",
      "Tiggo 2 Pro",
      "Tiggo 4 Pro",
      "Tiggo 7 Pro",
      "Tiggo 8 Pro",
      "Arrizo 5",
      "Omoda C5",
    ],
  },
  {
    code: "gwm",
    name: "GWM",
    models: [
      "Steed 5",
      "Steed 6",
      "P-Series",
      "Tank 300",
      "Tank 500",
      "Ora 03",
    ],
  },
  { code: "haval", name: "Haval", models: ["H1", "H2", "H6", "H9", "Jolion"] },
  { code: "jac", name: "JAC", models: ["T6", "T8", "T9", "X200", "JS4"] },
  {
    code: "byd",
    name: "BYD",
    models: ["Dolphin", "Atto 3", "Seal", "Seal U", "Song Plus", "Tang"],
  },
  {
    code: "tesla",
    name: "Tesla",
    models: ["Model 3", "Model S", "Model X", "Model Y"],
  },
  {
    code: "daihatsu",
    name: "Daihatsu",
    models: [
      "Mira",
      "Move",
      "Tanto",
      "Boon",
      "Terios",
      "Rocky",
      "Cast",
      "Hijet",
    ],
  },
  {
    code: "opel",
    name: "Opel",
    models: ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Zafira"],
  },
  {
    code: "tata",
    name: "Tata",
    models: ["Indica", "Bolt", "Tiago", "Nexon", "Xenon", "Ace"],
  },
] as const;

const CREATE_MAKE_TABLE_SQL = `
  CREATE TABLE vehicle_makes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    code text NOT NULL,
    name text NOT NULL,
    logo_url text,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_vehicle_makes_code CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    CONSTRAINT chk_vehicle_makes_name CHECK (length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT chk_vehicle_makes_sort_order CHECK (sort_order >= 0),
    CONSTRAINT uq_vehicle_makes_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT uq_vehicle_makes_tenant_id_id UNIQUE (tenant_id, id)
  )
`;

const CREATE_MODEL_TABLE_SQL = `
  CREATE TABLE vehicle_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    make_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_vehicle_models_code CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    CONSTRAINT chk_vehicle_models_name CHECK (length(btrim(name)) BETWEEN 1 AND 120),
    CONSTRAINT chk_vehicle_models_sort_order CHECK (sort_order >= 0),
    CONSTRAINT uq_vehicle_models_tenant_make_code UNIQUE (tenant_id, make_id, code),
    CONSTRAINT fk_vehicle_models_tenant_make FOREIGN KEY (tenant_id, make_id)
      REFERENCES vehicle_makes(tenant_id, id) ON DELETE RESTRICT
  )
`;

const ADD_MAKE_COLUMNS_SQL = `
  ALTER TABLE vehicle_makes
    ADD COLUMN IF NOT EXISTS tenant_id uuid,
    ADD COLUMN IF NOT EXISTS code text,
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true
`;

const ADD_MODEL_COLUMNS_SQL = `
  ALTER TABLE vehicle_models
    ADD COLUMN IF NOT EXISTS tenant_id uuid,
    ADD COLUMN IF NOT EXISTS code text,
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true
`;

const MAKE_CONSTRAINTS = [
  [
    "fk_vehicle_makes_tenant_id",
    "FOREIGN KEY (tenant_id) REFERENCES tenants(id)",
  ],
  ["chk_vehicle_makes_code", "CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$')"],
  ["chk_vehicle_makes_name", "CHECK (length(btrim(name)) BETWEEN 1 AND 80)"],
  ["chk_vehicle_makes_sort_order", "CHECK (sort_order >= 0)"],
  ["uq_vehicle_makes_tenant_code", "UNIQUE (tenant_id, code)"],
  ["uq_vehicle_makes_tenant_id_id", "UNIQUE (tenant_id, id)"],
] as const;

const MODEL_CONSTRAINTS = [
  ["chk_vehicle_models_code", "CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$')"],
  ["chk_vehicle_models_name", "CHECK (length(btrim(name)) BETWEEN 1 AND 120)"],
  ["chk_vehicle_models_sort_order", "CHECK (sort_order >= 0)"],
  ["uq_vehicle_models_tenant_make_code", "UNIQUE (tenant_id, make_id, code)"],
  [
    "fk_vehicle_models_tenant_make",
    "FOREIGN KEY (tenant_id, make_id) REFERENCES vehicle_makes(tenant_id, id) ON DELETE RESTRICT",
  ],
] as const;

type ConstraintDefinition = readonly [name: string, definition: string];

export class CreateVehicleCatalogue1761300000000 implements MigrationInterface {
  name = "CreateVehicleCatalogue1761300000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await prepareMakeTable(queryRunner);
    await prepareModelTable(queryRunner);
    const tenants: Array<{ id: string }> = await queryRunner.query(
      "SELECT id FROM tenants",
    );
    await seedTenants(queryRunner, tenants);
    await enableTenantIsolation(queryRunner, "vehicle_makes");
    await enableTenantIsolation(queryRunner, "vehicle_models");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_models");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_makes");
  }
}

async function prepareMakeTable(queryRunner: QueryRunner): Promise<void> {
  if (!(await queryRunner.hasTable("vehicle_makes"))) {
    await createMakeTable(queryRunner);
    return;
  }
  await reconcileMakeTable(queryRunner);
}

async function prepareModelTable(queryRunner: QueryRunner): Promise<void> {
  if (!(await queryRunner.hasTable("vehicle_models"))) {
    await createModelTable(queryRunner);
    return;
  }
  await reconcileModelTable(queryRunner);
}

async function createMakeTable(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(CREATE_MAKE_TABLE_SQL);
  await setTenantDefault(queryRunner, "vehicle_makes");
  await queryRunner.query(
    "CREATE INDEX IF NOT EXISTS idx_vehicle_makes_active_catalogue ON vehicle_makes (tenant_id, active, sort_order, name)",
  );
}

async function createModelTable(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(CREATE_MODEL_TABLE_SQL);
  await setTenantDefault(queryRunner, "vehicle_models");
  await queryRunner.query(
    "CREATE INDEX IF NOT EXISTS idx_vehicle_models_active_catalogue ON vehicle_models (tenant_id, make_id, active, sort_order, name)",
  );
}

async function reconcileMakeTable(queryRunner: QueryRunner): Promise<void> {
  const hasSlug = await queryRunner.hasColumn("vehicle_makes", "slug");
  await queryRunner.query(ADD_MAKE_COLUMNS_SQL);
  await backfillMakes(queryRunner, hasSlug);
  await removeLegacyMakeConstraints(queryRunner, hasSlug);
  await enforceCatalogueColumns(queryRunner, "vehicle_makes");
  await addConstraints(queryRunner, "vehicle_makes", MAKE_CONSTRAINTS);
  await setTenantDefault(queryRunner, "vehicle_makes");
  await createMakeIndex(queryRunner);
}

async function reconcileModelTable(queryRunner: QueryRunner): Promise<void> {
  const hasSlug = await queryRunner.hasColumn("vehicle_models", "slug");
  await queryRunner.query(ADD_MODEL_COLUMNS_SQL);
  await backfillModels(queryRunner, hasSlug);
  await removeLegacyModelConstraints(queryRunner, hasSlug);
  await enforceCatalogueColumns(queryRunner, "vehicle_models");
  await addConstraints(queryRunner, "vehicle_models", MODEL_CONSTRAINTS);
  await setTenantDefault(queryRunner, "vehicle_models");
  await createModelIndex(queryRunner);
}

async function backfillMakes(
  queryRunner: QueryRunner,
  hasSlug: boolean,
): Promise<void> {
  const source = hasSlug ? "COALESCE(slug, name)" : "name";
  await queryRunner.query(`
    UPDATE vehicle_makes
    SET tenant_id = COALESCE(tenant_id, (SELECT id FROM tenants ORDER BY created_at, id LIMIT 1)),
        code = ${normalizedCodeSql(source, "id")},
        sort_order = COALESCE(sort_order, 0),
        active = COALESCE(active, true)
  `);
}

async function backfillModels(
  queryRunner: QueryRunner,
  hasSlug: boolean,
): Promise<void> {
  const source = hasSlug
    ? "COALESCE(vehicle_models.slug, vehicle_models.name)"
    : "vehicle_models.name";
  await queryRunner.query(`
    UPDATE vehicle_models
    SET tenant_id = vehicle_makes.tenant_id,
        code = ${normalizedCodeSql(source, "vehicle_models.id", "vehicle_models.code")},
        sort_order = COALESCE(vehicle_models.sort_order, 0),
        active = COALESCE(vehicle_models.active, true)
    FROM vehicle_makes
    WHERE vehicle_makes.id = vehicle_models.make_id
  `);
}

function normalizedCodeSql(
  source: string,
  id: string,
  currentCode = "code",
): string {
  return `COALESCE(
    NULLIF(trim(BOTH '-' FROM regexp_replace(lower(trim(COALESCE(NULLIF(${currentCode}, ''), ${source}))), '[^a-z0-9]+', '-', 'g')), ''),
    'legacy-' || replace(${id}::text, '-', '')
  )`;
}

async function removeLegacyMakeConstraints(
  queryRunner: QueryRunner,
  hasSlug: boolean,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE vehicle_makes
    DROP CONSTRAINT IF EXISTS uq_vehicle_makes_slug,
    DROP CONSTRAINT IF EXISTS uq_vehicle_makes_name`);
  if (hasSlug)
    await queryRunner.query(
      "ALTER TABLE vehicle_makes ALTER COLUMN slug DROP NOT NULL",
    );
}

async function removeLegacyModelConstraints(
  queryRunner: QueryRunner,
  hasSlug: boolean,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE vehicle_models
    DROP CONSTRAINT IF EXISTS uq_vehicle_models_make_slug,
    DROP CONSTRAINT IF EXISTS vehicle_models_make_id_fkey`);
  if (hasSlug)
    await queryRunner.query(
      "ALTER TABLE vehicle_models ALTER COLUMN slug DROP NOT NULL",
    );
}

async function enforceCatalogueColumns(
  queryRunner: QueryRunner,
  table: string,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE ${table}
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN code SET NOT NULL,
    ALTER COLUMN sort_order SET NOT NULL,
    ALTER COLUMN active SET NOT NULL`);
}

async function addConstraints(
  queryRunner: QueryRunner,
  table: string,
  constraints: readonly ConstraintDefinition[],
): Promise<void> {
  for (const [name, definition] of constraints) {
    await addConstraintIfMissing(queryRunner, table, name, definition);
  }
}

async function addConstraintIfMissing(
  queryRunner: QueryRunner,
  table: string,
  name: string,
  definition: string,
): Promise<void> {
  const rows: unknown[] = await queryRunner.query(
    "SELECT 1 FROM pg_constraint WHERE conrelid = $1::regclass AND conname = $2",
    [table, name],
  );
  if (rows.length === 0) {
    await queryRunner.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${name} ${definition}`,
    );
  }
}

async function createMakeIndex(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    "CREATE INDEX IF NOT EXISTS idx_vehicle_makes_active_catalogue ON vehicle_makes (tenant_id, active, sort_order, name)",
  );
}

async function createModelIndex(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    "CREATE INDEX IF NOT EXISTS idx_vehicle_models_active_catalogue ON vehicle_models (tenant_id, make_id, active, sort_order, name)",
  );
}

async function seedTenants(
  queryRunner: QueryRunner,
  tenants: Array<{ id: string }>,
): Promise<void> {
  const hasLegacyReferences = await hasLegacySpecReferences(queryRunner);
  for (const tenant of tenants) {
    await setTenantContext(queryRunner, tenant.id);
    await seedTenant(queryRunner, tenant.id);
    if (hasLegacyReferences)
      await reconcileSpecReferences(queryRunner, tenant.id);
  }
  await setTenantContext(queryRunner, "");
}

async function hasLegacySpecReferences(
  queryRunner: QueryRunner,
): Promise<boolean> {
  const requiredColumns = ["tenant_id", "make_id", "model_id"];
  const checks = await Promise.all(
    requiredColumns.map((column) =>
      queryRunner.hasColumn("vehicle_specs", column),
    ),
  );
  return checks.every(Boolean);
}

async function setTenantContext(
  queryRunner: QueryRunner,
  tenantId: string,
): Promise<void> {
  await queryRunner.query("SELECT set_config('app.tenant_id', $1, true)", [
    tenantId,
  ]);
}

async function reconcileSpecReferences(
  queryRunner: QueryRunner,
  tenantId: string,
): Promise<void> {
  await queryRunner.query(
    `UPDATE vehicle_specs specs
    SET make_id = makes.id
    FROM vehicle_makes makes
    WHERE specs.tenant_id = $1 AND makes.tenant_id = specs.tenant_id
      AND makes.code = ${specCodeSql("specs.make")}
      AND specs.make_id IS DISTINCT FROM makes.id`,
    [tenantId],
  );
  await queryRunner.query(
    `UPDATE vehicle_specs specs
    SET model_id = models.id
    FROM vehicle_models models
    WHERE specs.tenant_id = $1 AND models.tenant_id = specs.tenant_id
      AND models.make_id = specs.make_id AND models.code = ${specCodeSql("specs.model")}
      AND specs.model_id IS DISTINCT FROM models.id`,
    [tenantId],
  );
}

function specCodeSql(column: string): string {
  return `trim(BOTH '-' FROM regexp_replace(lower(trim(${column})), '[^a-z0-9]+', '-', 'g'))`;
}

async function seedTenant(
  queryRunner: QueryRunner,
  tenantId: string,
): Promise<void> {
  for (const [makeIndex, make] of MAKE_SEEDS.entries()) {
    const rows: Array<{ id: string }> = await queryRunner.query(
      `INSERT INTO vehicle_makes (tenant_id, code, name, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, code) DO UPDATE
       SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order,
           active = true, updated_at = now()
       RETURNING id`,
      [tenantId, make.code, make.name, makeIndex],
    );
    await seedModels(queryRunner, tenantId, rows[0].id, make.models);
  }
}

async function seedModels(
  queryRunner: QueryRunner,
  tenantId: string,
  makeId: string,
  models: readonly string[],
): Promise<void> {
  for (const [modelIndex, name] of models.entries()) {
    await queryRunner.query(
      `INSERT INTO vehicle_models (tenant_id, make_id, code, name, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, make_id, code) DO UPDATE
       SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order,
           active = true, updated_at = now()`,
      [tenantId, makeId, toCode(name), name, modelIndex],
    );
  }
}

async function setTenantDefault(
  queryRunner: QueryRunner,
  table: string,
): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE ${table} ALTER COLUMN tenant_id SET DEFAULT ` +
      "(NULLIF(current_setting('app.tenant_id', true), '')::uuid)",
  );
}

async function enableTenantIsolation(
  queryRunner: QueryRunner,
  table: string,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
  await queryRunner.query(
    `DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table}`,
  );
  await queryRunner.query(`
    CREATE POLICY tenant_isolation_${table} ON ${table}
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  `);
}

function toCode(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
