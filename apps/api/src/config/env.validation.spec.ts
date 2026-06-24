import { validateDatabaseEnv, validateEnv } from "./env.validation";

describe("validateEnv", () => {
  const baseEnv = {
    NODE_ENV: "development",
    PORT: "4000",
    DATABASE_URL: "postgresql://auto_iq:auto_iq_dev@localhost:5432/auto_iq",
    DATABASE_SSL: "false",
    REDIS_URL: "redis://localhost:6379",
    REDIS_CONNECT_TIMEOUT_MS: "1000",
    CORS_ORIGINS: "http://localhost:3000",
    CSRF_COOKIE_NAME: "auto_iq_csrf",
    CSRF_HEADER_NAME: "x-csrf-token",
    SESSION_COOKIE_NAME: "auto_iq_session",
    SESSION_COOKIE_SAME_SITE: "lax",
    SESSION_COOKIE_SECURE: "false",
    SESSION_SECRET: "dev-auto-iq-session-secret-change-me",
    STORAGE_FORCE_PATH_STYLE: "true",
    STORAGE_PRESIGN_TTL_SECONDS: "900",
  };

  it("maps Railway Tigris AWS variables into the storage config", () => {
    const env = validateEnv({
      ...baseEnv,
      AWS_ENDPOINT_URL_S3: "https://fly.storage.tigris.dev",
      AWS_REGION: "auto",
      AWS_ACCESS_KEY_ID: "tigris-access-key",
      AWS_SECRET_ACCESS_KEY: "tigris-secret-key",
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
        STORAGE_ACCESS_KEY: "tigris-access-key",
        STORAGE_SECRET_KEY: "tigris-secret-key",
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
      STORAGE_ACCESS_KEY: "minioadmin",
      STORAGE_SECRET_KEY: "minioadmin",
      STORAGE_BUCKET: "auto-iq-local",
    });

    expect(env.REDIS_CONNECT_TIMEOUT_MS).toBe(750);
  });

  it("accepts SendGrid and Gikko notification configuration", () => {
    const env = validateEnv({
      ...baseEnv,
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_REGION: "us-east-1",
      STORAGE_ACCESS_KEY: "minioadmin",
      STORAGE_SECRET_KEY: "minioadmin",
      STORAGE_BUCKET: "auto-iq-local",
      NOTIFICATION_EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "sendgrid-key",
      SENDGRID_SENDER_EMAIL: "no-reply@autoiq.example",
      NOTIFICATION_SMS_PROVIDER: "gikko",
      GIKKO_API_KEY: "gikko-key",
      GIKKO_BASE_URL: "https://api.infobip.com",
      GIKKO_SENDER_NAME: "AutoIQ",
      GIKKO_SMS_AUTH_SCHEME: "App",
      GIKKO_SMS_TIMEOUT_MS: "10000",
      GIKKO_SMS_ENABLED: "true",
    });

    expect(env.NOTIFICATION_EMAIL_PROVIDER).toBe("sendgrid");
    expect(env.SENDGRID_API_KEY).toBe("sendgrid-key");
    expect(env.NOTIFICATION_SMS_PROVIDER).toBe("gikko");
    expect(env.GIKKO_API_KEY).toBe("gikko-key");
    expect(env.GIKKO_SMS_ENABLED).toBe(true);
    expect(env.GIKKO_SMS_TIMEOUT_MS).toBe(10000);
  });

  it("accepts database-only configuration for cli migrations", () => {
    const env = validateDatabaseEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://auto_iq:auto_iq_dev@localhost:5432/auto_iq",
      DATABASE_SSL: "false",
    });

    expect(env.DATABASE_URL).toBe("postgresql://auto_iq:auto_iq_dev@localhost:5432/auto_iq");
    expect(env.DATABASE_SSL).toBe(false);
  });
});
