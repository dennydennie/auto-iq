/**
 * Project: auto-iq
 * Module: apps/api database config tests
 * Author: backend_developer agent
 * Date: 2026-06-09
 */
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import type { DataSourceOptions } from "typeorm";

describe("database.config", () => {
  const runtimeEnv = {
    NODE_ENV: "development",
    PORT: "4000",
    DATABASE_URL: "postgresql://auto_iq:local-db-auth-token@localhost:5432/auto_iq",
    DATABASE_SSL: "false",
    REDIS_URL: "redis://localhost:6379",
    CORS_ORIGINS: "http://localhost:3000",
    SESSION_SECRET: "local-session-signing-key",
    STORAGE_ENDPOINT: "http://localhost:9000",
    STORAGE_REGION: "us-east-1",
    STORAGE_ACCESS_KEY: "local-storage-access-key",
    STORAGE_SECRET_KEY: "local-storage-signing-key",
    STORAGE_BUCKET: "auto-iq-local",
  } satisfies NodeJS.ProcessEnv;

  const cliEnv = {
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://auto_iq:local-db-auth-token@localhost:5432/auto_iq",
    DATABASE_SSL: "false",
  } satisfies NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.resetModules();
    Object.assign(process.env, runtimeEnv);
  });

  it("builds a cli datasource from database-only environment values", () => {
    const { buildDataSourceOptions } = require("./database.config") as typeof import("./database.config");
    const options = buildDataSourceOptions(cliEnv) as DataSourceOptions & {
      url: string;
      ssl: false | { rejectUnauthorized: false };
    };

    expect(options).toMatchObject({
      type: "postgres",
      url: cliEnv.DATABASE_URL,
      synchronize: false,
      migrationsRun: false,
      logging: ["warn", "error"],
      ssl: false,
    });
    expect(options.entities).toEqual(
      expect.arrayContaining([expect.stringContaining("/db/entity/**/*.entity.{ts,js}")]),
    );
    expect(options.migrations).toEqual(
      expect.arrayContaining([expect.stringContaining("/db/migrations/*{.ts,.js}")]),
    );
  });

  it("enables ssl for production-ready cli migration runs", () => {
    const { buildDataSourceOptions } = require("./database.config") as typeof import("./database.config");
    const options = buildDataSourceOptions({
      ...cliEnv,
      NODE_ENV: "production",
      DATABASE_SSL: "true",
    }) as DataSourceOptions & {
      ssl: false | { rejectUnauthorized: false };
    };

    expect(options.logging).toEqual(["error"]);
    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("builds nest runtime options without bootstrapping the app", () => {
    const { buildTypeOrmOptions } = require("./database.config") as typeof import("./database.config");
    const options = buildTypeOrmOptions(runtimeEnv) as TypeOrmModuleOptions & {
      url: string;
    };

    expect(options.autoLoadEntities).toBe(false);
    expect(options.retryAttempts).toBe(1);
    expect(options.retryDelay).toBe(1_000);
    expect(options.url).toBe(runtimeEnv.DATABASE_URL);
  });
});
