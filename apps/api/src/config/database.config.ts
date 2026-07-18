/**
 * Project: auto-iq
 * Module: apps/api database
 * Author: backend_developer agent
 * Date: 2026-06-09
 */
import "reflect-metadata";
import { registerAs } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "node:path";
import { DataSource, type DataSourceOptions } from "typeorm";
import { validateDatabaseEnv } from "./env.validation";

/**
 * Builds the Nest TypeORM options from validated environment variables.
 */
export const typeorm = registerAs("typeorm", (): TypeOrmModuleOptions => buildTypeOrmOptions());

/**
 * Builds TypeORM datasource options for both Nest runtime and CLI migrations.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const validatedEnv = validateDatabaseEnv(env);
  return {
    type: "postgres",
    url: validatedEnv.DATABASE_URL,
    synchronize: false,
    migrationsRun: false,
    logging: validatedEnv.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ssl: validatedEnv.DATABASE_SSL
      ? {
          rejectUnauthorized: true,
          ca: validatedEnv.DATABASE_SSL_CA,
          ...(validatedEnv.DATABASE_SSL_SERVER_NAME
            ? { servername: validatedEnv.DATABASE_SSL_SERVER_NAME }
            : {}),
        }
      : false,
    extra: {
      connectionTimeoutMillis: validatedEnv.DATABASE_CONNECT_TIMEOUT_MS,
      statement_timeout: validatedEnv.DATABASE_STATEMENT_TIMEOUT_MS,
    },
    entities: [join(__dirname, "../db/entity/**/*.entity.{ts,js}")],
    migrations: [join(__dirname, "../db/migrations/*{.ts,.js}")],
    subscribers: [join(__dirname, "../common/tenancy/*.subscriber.{ts,js}")],
  };
}

/**
 * Builds the TypeORM module options used by NestJS runtime boot.
 */
export function buildTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  return {
    ...buildDataSourceOptions(env),
    autoLoadEntities: false,
    retryAttempts: 1,
    retryDelay: 1_000,
  };
}

const dataSource = new DataSource(buildDataSourceOptions());

export default dataSource;
