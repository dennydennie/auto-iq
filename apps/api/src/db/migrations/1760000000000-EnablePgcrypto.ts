import type { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePgcrypto1760000000000 implements MigrationInterface {
  name = "EnablePgcrypto1760000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto"');
  }
}
