import { validateDatabaseEnv, validateEnv } from "./env.validation";

describe("validateEnv", () => {
  const baseEnv = {
    NODE_ENV: "development",
    PORT: "4000",
    DATABASE_URL: "postgresql://auto_iq:local-db-auth-token@localhost:5432/auto_iq",
    DATABASE_SSL: "false",
    REDIS_URL: "redis://localhost:6379",
    REDIS_CONNECT_TIMEOUT_MS: "1000",
    CORS_ORIGINS: "http://localhost:3000",
    CSRF_COOKIE_NAME: "auto_iq_csrf",
    CSRF_HEADER_NAME: "x-csrf-token",
    SESSION_COOKIE_NAME: "auto_iq_session",
    SESSION_COOKIE_SAME_SITE: "lax",
    SESSION_COOKIE_SECURE: "false",
    SESSION_SECRET: "local-session-signing-key",
    STORAGE_ENDPOINT: "http://localhost:9000",
    STORAGE_REGION: "us-east-1",
    STORAGE_ACCESS_KEY: "local-storage-access-key",
    STORAGE_SECRET_KEY: "local-storage-signing-key",
    STORAGE_BUCKET: "auto-iq-local",
    STORAGE_FORCE_PATH_STYLE: "true",
    STORAGE_PRESIGN_TTL_SECONDS: "900",
  };

  it("maps Railway Tigris AWS variables into the storage config", () => {
    const env = validateEnv({
      ...baseEnv,
      AWS_ENDPOINT_URL_S3: "https://fly.storage.tigris.dev",
      AWS_REGION: "auto",
      AWS_ACCESS_KEY_ID: "tigris-access-id",
      AWS_SECRET_ACCESS_KEY: "tigris-signing-key",
      BUCKET_NAME: "auto-iq-production",
    });

    expect(env.STORAGE_ENDPOINT).toBe("https://fly.storage.tigris.dev");
    expect(env.STORAGE_REGION).toBe("auto");
    expect(env.STORAGE_ACCESS_KEY).toBe("tigris-access-key");
    expect(env.STORAGE_SECRET_KEY).toBe("tigris-secret-key");
    expect(env.STORAGE_BUCKET).toBe("auto-iq-production");
  });

  it("requires Sentry and secure cookies in production-like environments", () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: "production",
        STORAGE_ENDPOINT: "https://fly.storage.tigris.dev",
        STORAGE_REGION: "auto",
        STORAGE_ACCESS_KEY: "tigris-access-id",
        STORAGE_SECRET_KEY: "tigris-signing-key",
        STORAGE_BUCKET: "auto-iq-production",
      }),
    ).toThrow(
      "Missing required production environment variables: SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE, SESSION_COOKIE_SECURE=true",
    );
  });

  it("validates an explicit Redis connection timeout", () => {
    const env = validateEnv({
      ...baseEnv,
      REDIS_CONNECT_TIMEOUT_MS: "750",
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_REGION: "us-east-1",
      STORAGE_ACCESS_KEY: "local-storage-access-key",
      STORAGE_SECRET_KEY: "local-storage-signing-key",
      STORAGE_BUCKET: "auto-iq-local",
    });

    expect(env.REDIS_CONNECT_TIMEOUT_MS).toBe(750);
  });

  it("accepts database-only configuration for cli migrations", () => {
    const env = validateDatabaseEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://auto_iq:local-db-auth-token@localhost:5432/auto_iq",
      DATABASE_SSL: "false",
    });

    expect(env.DATABASE_URL).toBe("postgresql://auto_iq:local-db-auth-token@localhost:5432/auto_iq");
    expect(env.DATABASE_SSL).toBe(false);
  });
});
