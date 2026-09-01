import type { MigrationInterface, QueryRunner } from "typeorm";

const SEARCH_INDEXES = [
  "CREATE INDEX idx_vehicle_specs_make_search ON vehicle_specs USING gin (make gin_trgm_ops)",
  "CREATE INDEX idx_vehicle_specs_model_search ON vehicle_specs USING gin (model gin_trgm_ops)",
  "CREATE INDEX idx_users_city_search ON users USING gin (city gin_trgm_ops)",
  "CREATE INDEX idx_vehicles_slug_search ON vehicles USING gin (slug gin_trgm_ops)",
] as const;

export class AddCatalogueSearchIndexes1761500000000 implements MigrationInterface {
  name = "AddCatalogueSearchIndexes1761500000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    for (const statement of SEARCH_INDEXES) {
      await queryRunner.query(statement);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const index of [...SEARCH_INDEXES].reverse().map(indexName)) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${index}`);
    }
  }
}

function indexName(statement: string) {
  const match = /^CREATE INDEX ([a-z0-9_]+) /.exec(statement);
  if (!match) throw new Error("Catalogue search index statement is invalid");
  return match[1];
}
