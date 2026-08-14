import type { MigrationInterface, QueryRunner } from "typeorm";

const MAKE_SEEDS = [
  { code: "toyota", name: "Toyota", models: ["Hilux", "Corolla", "Fortuner", "Land Cruiser", "Land Cruiser Prado", "RAV4", "Harrier", "Aqua", "Vitz", "Passo", "Premio", "Allion", "Axio", "Fielder", "Wish", "Sienta", "Noah", "Voxy", "Hiace", "Probox", "Rush", "C-HR", "Camry", "Crown", "Raum"] },
  { code: "honda", name: "Honda", models: ["Vezel", "Fit", "CR-V", "Civic", "Accord", "Grace", "Shuttle", "Freed", "Insight", "Stepwgn", "Odyssey", "N-Box", "HR-V", "BR-V"] },
  { code: "mazda", name: "Mazda", models: ["Demio", "Mazda2", "Axela", "Mazda3", "Atenza", "Mazda6", "CX-3", "CX-5", "CX-30", "CX-8", "CX-9", "BT-50", "Bongo"] },
  { code: "nissan", name: "Nissan", models: ["Note", "X-Trail", "Navara", "NP200", "NP300", "Juke", "Qashqai", "Tiida", "March", "Serena", "AD Van", "Patrol", "Elgrand", "Dualis", "Sylphy", "Skyline", "Caravan"] },
  { code: "isuzu", name: "Isuzu", models: ["D-Max", "KB", "MU-X", "N-Series", "Trooper", "Como"] },
  { code: "ford", name: "Ford", models: ["Ranger", "Everest", "EcoSport", "Territory", "Focus", "Fiesta", "Kuga", "Escape", "Transit", "Tourneo", "Mustang", "Figo"] },
  { code: "mercedes-benz", name: "Mercedes-Benz", models: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLB", "GLC", "GLE", "GLS", "ML-Class", "Vito", "Sprinter"] },
  { code: "bmw", name: "BMW", models: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X2", "X3", "X5", "X6", "X7"] },
  { code: "volkswagen", name: "Volkswagen", models: ["Polo", "Polo Vivo", "Golf", "Tiguan", "T-Cross", "T-Roc", "Amarok", "Touareg", "Caddy", "Transporter", "Passat", "Jetta"] },
  { code: "suzuki", name: "Suzuki", models: ["Alto", "S-Presso", "Swift", "Baleno", "Dzire", "Celerio", "Ignis", "Jimny", "Vitara", "Grand Vitara", "Ertiga", "Fronx"] },
  { code: "mitsubishi", name: "Mitsubishi", models: ["Pajero", "Pajero Sport", "Triton", "Outlander", "ASX", "Eclipse Cross", "Delica", "Lancer", "Colt", "Mirage", "Canter"] },
  { code: "subaru", name: "Subaru", models: ["Forester", "Impreza", "XV", "Crosstrek", "Outback", "Legacy", "Levorg", "WRX", "BRZ", "Exiga"] },
  { code: "hyundai", name: "Hyundai", models: ["Tucson", "Santa Fe", "Creta", "Venue", "Kona", "i10", "Grand i10", "i20", "i30", "Elantra", "Accent", "H-1"] },
  { code: "kia", name: "Kia", models: ["Sportage", "Sorento", "Seltos", "Sonet", "Picanto", "Rio", "Cerato", "Carnival", "Soul", "K2700", "K2500"] },
  { code: "chevrolet", name: "Chevrolet", models: ["Trailblazer", "Cruze", "Spark", "Aveo", "Captiva", "Utility", "Orlando", "Sonic", "Lumina"] },
  { code: "land-rover", name: "Land Rover", models: ["Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar", "Discovery", "Discovery Sport", "Defender", "Freelander"] },
  { code: "jeep", name: "Jeep", models: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator", "Patriot"] },
  { code: "audi", name: "Audi", models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8"] },
  { code: "lexus", name: "Lexus", models: ["IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "CT", "RC"] },
  { code: "renault", name: "Renault", models: ["Kwid", "Clio", "Sandero", "Duster", "Captur", "Koleos", "Triber", "Megane"] },
  { code: "peugeot", name: "Peugeot", models: ["108", "208", "308", "508", "2008", "3008", "5008", "Partner", "Landtrek"] },
  { code: "volvo", name: "Volvo", models: ["V40", "S60", "S90", "XC40", "XC60", "XC90", "V60", "V90"] },
  { code: "mahindra", name: "Mahindra", models: ["KUV100", "XUV300", "XUV500", "XUV700", "Scorpio", "Pik Up", "Thar"] },
  { code: "chery", name: "Chery", models: ["QQ3", "Tiggo 2 Pro", "Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo 5", "Omoda C5"] },
  { code: "gwm", name: "GWM", models: ["Steed 5", "Steed 6", "P-Series", "Tank 300", "Tank 500", "Ora 03"] },
  { code: "haval", name: "Haval", models: ["H1", "H2", "H6", "H9", "Jolion"] },
  { code: "jac", name: "JAC", models: ["T6", "T8", "T9", "X200", "JS4"] },
  { code: "byd", name: "BYD", models: ["Dolphin", "Atto 3", "Seal", "Seal U", "Song Plus", "Tang"] },
  { code: "tesla", name: "Tesla", models: ["Model 3", "Model S", "Model X", "Model Y"] },
  { code: "daihatsu", name: "Daihatsu", models: ["Mira", "Move", "Tanto", "Boon", "Terios", "Rocky", "Cast", "Hijet"] },
  { code: "opel", name: "Opel", models: ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Zafira"] },
  { code: "tata", name: "Tata", models: ["Indica", "Bolt", "Tiago", "Nexon", "Xenon", "Ace"] },
] as const;

const CREATE_MAKE_TABLE_SQL = `
  CREATE TABLE vehicle_catalogue_makes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    logo_url text,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_vehicle_catalogue_makes_code CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    CONSTRAINT chk_vehicle_catalogue_makes_name CHECK (length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT chk_vehicle_catalogue_makes_sort_order CHECK (sort_order >= 0),
    CONSTRAINT uq_vehicle_catalogue_makes_code UNIQUE (code)
  )
`;

const CREATE_MODEL_TABLE_SQL = `
  CREATE TABLE vehicle_catalogue_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    make_id uuid NOT NULL REFERENCES vehicle_catalogue_makes(id) ON DELETE RESTRICT,
    code text NOT NULL,
    name text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_vehicle_catalogue_models_code CHECK (code ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
    CONSTRAINT chk_vehicle_catalogue_models_name CHECK (length(btrim(name)) BETWEEN 1 AND 120),
    CONSTRAINT chk_vehicle_catalogue_models_sort_order CHECK (sort_order >= 0),
    CONSTRAINT uq_vehicle_catalogue_models_make_code UNIQUE (make_id, code)
  )
`;

export class CreateVehicleCatalogue1760510000000 implements MigrationInterface {
  name = "CreateVehicleCatalogue1760510000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(CREATE_MAKE_TABLE_SQL);
    await queryRunner.query(CREATE_MODEL_TABLE_SQL);
    await queryRunner.query(
      "CREATE INDEX idx_vehicle_catalogue_makes_active ON vehicle_catalogue_makes (active, sort_order, name)",
    );
    await queryRunner.query(
      "CREATE INDEX idx_vehicle_catalogue_models_active ON vehicle_catalogue_models (make_id, active, sort_order, name)",
    );
    await seedCatalogue(queryRunner);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_catalogue_models");
    await queryRunner.query("DROP TABLE IF EXISTS vehicle_catalogue_makes");
  }
}

async function seedCatalogue(queryRunner: QueryRunner): Promise<void> {
  for (const [makeIndex, make] of MAKE_SEEDS.entries()) {
    const rows: Array<{ id: string }> = await queryRunner.query(
      `INSERT INTO vehicle_catalogue_makes (code, name, sort_order)
       VALUES ($1, $2, $3) RETURNING id`,
      [make.code, make.name, makeIndex],
    );
    await seedModels(queryRunner, rows[0].id, make.models);
  }
}

async function seedModels(
  queryRunner: QueryRunner,
  makeId: string,
  models: readonly string[],
): Promise<void> {
  for (const [modelIndex, name] of models.entries()) {
    await queryRunner.query(
      `INSERT INTO vehicle_catalogue_models (make_id, code, name, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [makeId, toCode(name), name, modelIndex],
    );
  }
}

function toCode(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
