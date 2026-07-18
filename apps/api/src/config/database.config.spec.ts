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
    DATABASE_URL: "postgresql://auto_iq:auto_iq_dev@localhost:5432/auto_iq",
    DATABASE_SSL: "false",
    REDIS_URL: "redis://localhost:6379",
    CORS_ORIGINS: "http://localhost:3000",
    SESSION_SECRET: "secret",
    STORAGE_ENDPOINT: "http://localhost:9000",
    STORAGE_REGION: "us-east-1",
    STORAGE_ACCESS_KEY: "minioadmin",
    STORAGE_SECRET_KEY: "minioadmin",
    STORAGE_BUCKET: "auto-iq-local",
  } satisfies NodeJS.ProcessEnv;

  const cliEnv = {
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://auto_iq:auto_iq_dev@localhost:5432/auto_iq",
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
      DATABASE_SSL_CA: "-----BEGIN CERTIFICATE-----\nci\n-----END CERTIFICATE-----",
      DATABASE_SSL_SERVER_NAME: "localhost",
      DATABASE_CONNECT_TIMEOUT_MS: "12000",
      DATABASE_STATEMENT_TIMEOUT_MS: "6000",
    }) as DataSourceOptions & {
      ssl: false | { rejectUnauthorized: boolean; ca?: string; servername?: string };
      extra?: { connectionTimeoutMillis?: number; statement_timeout?: number };
    };

    expect(options.logging).toEqual(["error"]);
    expect(options.ssl).toMatchObject({
      rejectUnauthorized: true,
      ca: "-----BEGIN CERTIFICATE-----\nci\n-----END CERTIFICATE-----",
      checkServerIdentity: expect.any(Function),
    });
    expect(options.extra).toMatchObject({
      connectionTimeoutMillis: 12000,
      statement_timeout: 6000,
    });
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
