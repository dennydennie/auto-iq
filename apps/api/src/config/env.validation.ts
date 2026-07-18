import { plainToInstance, Transform } from "class-transformer";
import {
  IsInt,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsPort,
  IsString,
  MinLength,
  Min,
  Max,
  Matches,
  validateSync,
} from "class-validator";

const ENVIRONMENTS = ["development", "test", "staging", "production"] as const;
const PRODUCTION_ENVIRONMENTS = new Set<ValidatedEnvironment["NODE_ENV"]>([
  "staging",
  "production",
]);
const DEFAULT_SESSION_SECRET = "dev-auto-iq-session-secret-change-me";
const DEFAULT_STORAGE_VALUES = new Set(["minioadmin", "auto-iq-local"]);

class DatabaseEnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV = "development";

  @Matches(/^postgres(ql)?:\/\//)
  DATABASE_URL!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  DATABASE_SSL = false;

  @IsOptional()
  @IsString()
  DATABASE_SSL_CA?: string;

  @IsOptional()
  @IsString()
  DATABASE_SSL_SERVER_NAME?: string;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 10_000))
  @IsInt()
  @Min(250)
  DATABASE_CONNECT_TIMEOUT_MS = 10_000;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 5_000))
  @IsInt()
  @Min(250)
  DATABASE_STATEMENT_TIMEOUT_MS = 5_000;
}

class EnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV = "development";

  @Transform(
    ({ obj, value }: { obj: Record<string, unknown>; value: unknown }) =>
      value ?? obj.API_PORT ?? "4000",
  )
  @IsPort()
  PORT = "4000";

  @Matches(/^postgres(ql)?:\/\//)
  DATABASE_URL!: string;

  @Matches(/^redis(s)?:\/\//)
  REDIS_URL!: string;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 1000))
  @IsInt()
  @Min(250)
  REDIS_CONNECT_TIMEOUT_MS = 1000;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS = "http://localhost:3000";

  @Transform(({ value }: { value: unknown }) => Number(value ?? 0))
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS = 0;

  @IsUUID()
  DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  BFF_SHARED_SECRET?: string;

  @IsString()
  CSRF_COOKIE_NAME = "auto_iq_csrf";

  @IsString()
  CSRF_HEADER_NAME = "x-csrf-token";

  @IsString()
  SESSION_COOKIE_NAME = "auto_iq_session";

  @IsOptional()
  @IsString()
  SESSION_COOKIE_DOMAIN?: string;

  @IsOptional()
  @IsIn(["lax", "strict", "none"])
  SESSION_COOKIE_SAME_SITE?: "lax" | "strict" | "none";

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  SESSION_COOKIE_SECURE?: boolean;

  @IsString()
  @IsNotEmpty()
  SESSION_SECRET = DEFAULT_SESSION_SECRET;

  @IsString()
  @IsNotEmpty()
  STORAGE_ENDPOINT = "http://localhost:9000";

  @IsString()
  @IsNotEmpty()
  STORAGE_REGION = "us-east-1";

  @IsString()
  @IsNotEmpty()
  STORAGE_ACCESS_KEY = "minioadmin";

  @IsString()
  @IsNotEmpty()
  STORAGE_SECRET_KEY = "minioadmin";

  @IsString()
  @IsNotEmpty()
  STORAGE_BUCKET = "auto-iq-local";

  @Matches(/^autoiq:\/\/reset-password$/)
  MOBILE_RESET_URL = "autoiq://reset-password";

  @IsOptional()
  @IsString()
  WEB_BASE_URL?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  STORAGE_FORCE_PATH_STYLE = true;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 900))
  @IsInt()
  STORAGE_PRESIGN_TTL_SECONDS = 900;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 10_000))
  @IsInt()
  @Min(250)
  STORAGE_CONNECT_TIMEOUT_MS = 10_000;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 30_000))
  @IsInt()
  @Min(250)
  STORAGE_SOCKET_TIMEOUT_MS = 30_000;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 10_000))
  @IsInt()
  @Min(250)
  REQUEST_TIMEOUT_MS = 10_000;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 60))
  @IsInt()
  @Min(1)
  GLOBAL_RATE_LIMIT_WINDOW_SECONDS = 60;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 120))
  @IsInt()
  @Min(1)
  GLOBAL_RATE_LIMIT_MAX = 120;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 10 * 1024 * 1024))
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 15 * 1024 * 1024))
  @IsInt()
  @Min(1)
  @Max(15 * 1024 * 1024)
  MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 120))
  @IsInt()
  @Min(10)
  @Max(3_600)
  NOTIFICATION_CLAIM_LEASE_SECONDS = 120;

  @IsOptional()
  @IsIn(["sandbox", "resend", "sendgrid"])
  NOTIFICATION_EMAIL_PROVIDER?: "sandbox" | "resend" | "sendgrid";

  @IsOptional()
  @IsString()
  NOTIFICATION_EMAIL_FROM?: string;

  @IsOptional()
  @IsString()
  NOTIFICATION_EMAIL_REPLY_TO?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  SENDGRID_API_KEY?: string;

  @IsOptional()
  @IsString()
  SENDGRID_API_BASE_URL?: string;

  @IsOptional()
  @IsString()
  SENDGRID_SENDER_EMAIL?: string;

  @IsOptional()
  @IsString()
  EMAIL_SENDER_EMAIL?: string;

  @IsOptional()
  @IsIn(["sandbox", "twilio", "gikko", "stub"])
  NOTIFICATION_SMS_PROVIDER?: "sandbox" | "twilio" | "gikko" | "stub";

  @IsOptional()
  @IsString()
  TWILIO_ACCOUNT_SID?: string;

  @IsOptional()
  @IsString()
  TWILIO_AUTH_TOKEN?: string;

  @IsOptional()
  @IsString()
  TWILIO_FROM_PHONE?: string;

  @IsOptional()
  @IsString()
  GIKKO_API_KEY?: string;

  @IsOptional()
  @IsString()
  GIKKO_SMS_API_KEY?: string;

  @IsOptional()
  @IsString()
  GIKKO_BASE_URL?: string;

  @IsOptional()
  @IsString()
  GIKKO_SMS_SEND_URL?: string;

  @IsOptional()
  @IsString()
  GIKKO_SENDER_NAME?: string;

  @IsOptional()
  @IsString()
  GIKKO_SMS_SENDER?: string;

  @IsOptional()
  @IsString()
  GIKKO_DELIVERY_REPORT_URL?: string;

  @IsOptional()
  @IsString()
  GIKKO_SMS_NOTIFY_URL?: string;

  @IsOptional()
  @IsString()
  GIKKO_SMS_AUTH_SCHEME?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  GIKKO_SMS_TIMEOUT_MS?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  GIKKO_SMS_ENABLED?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  SWAGGER_ENABLED = false;

  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  @IsOptional()
  @IsString()
  SENTRY_ENVIRONMENT?: string;

  @IsOptional()
  @IsString()
  SENTRY_RELEASE?: string;

  @IsOptional()
  @IsString()
  OPENAPI_OUTPUT_PATH?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  ENABLE_TEST_ERROR_ROUTE = false;

  @IsOptional()
  @IsString()
  DEBUG_TEST_ERROR_TOKEN?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  DATABASE_SSL = false;

  @IsOptional()
  @IsString()
  DATABASE_SSL_CA?: string;

  @IsOptional()
  @IsString()
  DATABASE_SSL_SERVER_NAME?: string;
}

export type ValidatedEnvironment = EnvironmentVariables;
export type ValidatedDatabaseEnvironment = DatabaseEnvironmentVariables;

export function validateEnv(config: Record<string, unknown>) {
  const env = plainToInstance(EnvironmentVariables, withStorageAliases(config));
  assertValidEnv(env);

  assertProductionEnv(env);

  return env;
}

export function validateDatabaseEnv(config: Record<string, unknown>) {
  const env = plainToInstance(DatabaseEnvironmentVariables, config);
  assertValidEnv(env);
  if (
    PRODUCTION_ENVIRONMENTS.has(env.NODE_ENV) &&
    (!env.DATABASE_SSL || !env.DATABASE_SSL_CA || !env.DATABASE_SSL_SERVER_NAME)
  ) {
    throw new Error(
      "Production database configuration requires DATABASE_SSL=true and DATABASE_SSL_CA and DATABASE_SSL_SERVER_NAME",
    );
  }
  return env;
}

function assertProductionEnv(env: ValidatedEnvironment) {
  if (!PRODUCTION_ENVIRONMENTS.has(env.NODE_ENV)) {
    return;
  }

  const missing = requiredProductionVariables(env);
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}

function requiredProductionVariables(env: ValidatedEnvironment): string[] {
  const missing: string[] = [];

  if (!env.SENTRY_DSN) {
    missing.push("SENTRY_DSN");
  }
  if (!env.SENTRY_ENVIRONMENT) {
    missing.push("SENTRY_ENVIRONMENT");
  }
  if (!env.SENTRY_RELEASE) {
    missing.push("SENTRY_RELEASE");
  }
  if (env.SESSION_COOKIE_SECURE !== true) {
    missing.push("SESSION_COOKIE_SECURE=true");
  }
  if (env.TRUST_PROXY_HOPS !== 1) {
    missing.push("TRUST_PROXY_HOPS=1");
  }
  if (!env.DEFAULT_TENANT_ID) {
    missing.push("DEFAULT_TENANT_ID");
  }
  if (!isProductionWebOrigin(env.WEB_BASE_URL)) {
    missing.push("WEB_BASE_URL(non-localhost HTTPS origin)");
  }
  if (!env.BFF_SHARED_SECRET) {
    missing.push("BFF_SHARED_SECRET");
  }
  if (env.DATABASE_SSL !== true) {
    missing.push("DATABASE_SSL=true");
  }
  if (!env.DATABASE_SSL_CA) {
    missing.push("DATABASE_SSL_CA");
  }
  if (!env.DATABASE_SSL_SERVER_NAME) {
    missing.push("DATABASE_SSL_SERVER_NAME");
  }
  if (env.SWAGGER_ENABLED === true) {
    missing.push("SWAGGER_ENABLED=false");
  }
  if (env.ENABLE_TEST_ERROR_ROUTE === true) {
    missing.push("ENABLE_TEST_ERROR_ROUTE=false");
  }
  if (!isProductionSessionSecret(env.SESSION_SECRET)) {
    missing.push("SESSION_SECRET(non-default, 32+ characters)");
  }
  if (!isProductionStorageEndpoint(env.STORAGE_ENDPOINT)) {
    missing.push("STORAGE_ENDPOINT(non-localhost HTTPS endpoint)");
  }
  if (DEFAULT_STORAGE_VALUES.has(env.STORAGE_ACCESS_KEY)) {
    missing.push("STORAGE_ACCESS_KEY(non-default)");
  }
  if (DEFAULT_STORAGE_VALUES.has(env.STORAGE_SECRET_KEY)) {
    missing.push("STORAGE_SECRET_KEY(non-default)");
  }
  if (DEFAULT_STORAGE_VALUES.has(env.STORAGE_BUCKET)) {
    missing.push("STORAGE_BUCKET(non-default)");
  }
  return missing;
}

function isProductionSessionSecret(value: string) {
  return value.length >= 32 && value !== DEFAULT_SESSION_SECRET;
}

function isProductionStorageEndpoint(value: string) {
  return isHttpsNonLocalhost(value);
}

function isHttpsNonLocalhost(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !isLocalhost(url.hostname);
  } catch {
    return false;
  }
}

function isLocalhost(hostname: string) {
  return new Set(["localhost", "127.0.0.1", "::1"]).has(hostname.toLowerCase());
}

function isProductionWebOrigin(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      hostname !== "::1"
    );
  } catch {
    return false;
  }
}

function assertValidEnv(env: object) {
  const errors = validateSync(env, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
}

function withStorageAliases(config: Record<string, unknown>) {
  const values = {
    ...config,
    STORAGE_ENDPOINT:
      config.STORAGE_ENDPOINT ??
      config.AWS_ENDPOINT_URL_S3 ??
      config.AWS_ENDPOINT_URL,
    STORAGE_REGION:
      config.STORAGE_REGION ?? config.AWS_REGION ?? config.AWS_DEFAULT_REGION,
    STORAGE_ACCESS_KEY: config.STORAGE_ACCESS_KEY ?? config.AWS_ACCESS_KEY_ID,
    STORAGE_SECRET_KEY:
      config.STORAGE_SECRET_KEY ?? config.AWS_SECRET_ACCESS_KEY,
    STORAGE_BUCKET:
      config.STORAGE_BUCKET ??
      config.BUCKET_NAME ??
      config.AWS_S3_BUCKET_NAME ??
      config.AWS_BUCKET_NAME,
    STORAGE_FORCE_PATH_STYLE:
      config.STORAGE_FORCE_PATH_STYLE ??
      storageUrlStyleToForcePathStyle(config.AWS_S3_URL_STYLE),
  };
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

function storageUrlStyleToForcePathStyle(value: unknown): boolean | undefined {
  if (value === "path") return true;
  if (value === "virtual") return false;
  return undefined;
}
