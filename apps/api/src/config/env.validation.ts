import { plainToInstance, Transform } from "class-transformer";
import {
  IsInt,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPort,
  IsString,
  Min,
  Matches,
  validateSync,
} from "class-validator";

const ENVIRONMENTS = ["development", "test", "staging", "production"] as const;
const PRODUCTION_ENVIRONMENTS = new Set<ValidatedEnvironment["NODE_ENV"]>(["staging", "production"]);

class DatabaseEnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV = "development";

  @Matches(/^postgres(ql)?:\/\//)
  DATABASE_URL!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  DATABASE_SSL = false;
}

class EnvironmentVariables {
  @IsIn(ENVIRONMENTS)
  NODE_ENV = "development";

  @Transform(({ obj, value }: { obj: Record<string, unknown>; value: unknown }) =>
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
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  SESSION_COOKIE_SECURE?: boolean;

  @IsString()
  @IsNotEmpty()
  SESSION_SECRET = "dev-auto-iq-session-secret-change-me";

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

  @IsOptional()
  @IsString()
  STORAGE_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  WEB_BASE_URL?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  STORAGE_FORCE_PATH_STYLE = true;

  @Transform(({ value }: { value: unknown }) => Number(value ?? 900))
  @IsInt()
  STORAGE_PRESIGN_TTL_SECONDS = 900;

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
  @IsIn(["sandbox", "twilio", "gikko"])
  NOTIFICATION_SMS_PROVIDER?: "sandbox" | "twilio" | "gikko";

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
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  GIKKO_SMS_ENABLED?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
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
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  ENABLE_TEST_ERROR_ROUTE = false;

  @IsOptional()
  @IsString()
  DEBUG_TEST_ERROR_TOKEN?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === "true" || value === true)
  DATABASE_SSL = false;
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
  return env;
}

function assertProductionEnv(env: ValidatedEnvironment) {
  if (!PRODUCTION_ENVIRONMENTS.has(env.NODE_ENV)) {
    return;
  }

  const missing = requiredProductionVariables(env);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}

function requiredProductionVariables(env: ValidatedEnvironment): string[] {
  const missing: string[] = [];

  if (env.NODE_ENV === "production" && !env.SENTRY_DSN) {
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
  if (!isProductionWebOrigin(env.WEB_BASE_URL)) {
    missing.push("WEB_BASE_URL(non-localhost HTTPS origin)");
  }

  return missing;
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
  return {
    ...config,
    STORAGE_ENDPOINT: config.STORAGE_ENDPOINT ?? config.AWS_ENDPOINT_URL_S3 ?? config.AWS_ENDPOINT_URL,
    STORAGE_REGION: config.STORAGE_REGION ?? config.AWS_REGION ?? config.AWS_DEFAULT_REGION,
    STORAGE_ACCESS_KEY: config.STORAGE_ACCESS_KEY ?? config.AWS_ACCESS_KEY_ID,
    STORAGE_SECRET_KEY: config.STORAGE_SECRET_KEY ?? config.AWS_SECRET_ACCESS_KEY,
    STORAGE_BUCKET: config.STORAGE_BUCKET ?? config.BUCKET_NAME ?? config.AWS_BUCKET_NAME,
  };
}
