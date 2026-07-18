import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function parseStorageUrl(): URL | null {
  try {
    return new URL(storageEndpoint());
  } catch {
    return null;
  }
}

function storageEndpoint() {
  return (
    process.env.STORAGE_ENDPOINT ??
    process.env.AWS_ENDPOINT_URL_S3 ??
    process.env.AWS_ENDPOINT_URL ??
    ""
  );
}

function parseStoragePatterns(): RemotePattern[] {
  const url = parseStorageUrl();
  if (!url || !["http:", "https:"].includes(url.protocol)) return [];
  const protocol = url.protocol.replace(":", "") as "http" | "https";
  const exactPattern = {
    protocol,
    hostname: url.hostname,
    port: url.port || undefined,
    pathname: "/**",
  };
  if (process.env.STORAGE_FORCE_PATH_STYLE === "true") {
    return [exactPattern];
  }
  return [{ ...exactPattern, hostname: `**.${url.hostname}` }, exactPattern];
}

const storagePatterns = parseStoragePatterns();
validateProductionObservability();
validateProductionStorage();

function validateProductionObservability() {
  if (process.env.NODE_ENV !== "production") return;
  const missing = [
    ["NEXT_PUBLIC_SENTRY_DSN", process.env.NEXT_PUBLIC_SENTRY_DSN],
    ["SENTRY_DSN", process.env.SENTRY_DSN],
    ["SENTRY_ENVIRONMENT", process.env.SENTRY_ENVIRONMENT],
    ["SENTRY_RELEASE", process.env.SENTRY_RELEASE],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing production web observability configuration: ${missing.join(", ")}`);
  }
}

function validateProductionStorage() {
  if (process.env.NODE_ENV !== "production") return;
  const url = parseStorageUrl();
  if (!url || url.protocol !== "https:" || isLocalhost(url.hostname)) {
    throw new Error("STORAGE_ENDPOINT is required in production");
  }
}

function isLocalhost(hostname: string) {
  return new Set(["localhost", "127.0.0.1", "::1"]).has(hostname.toLowerCase());
}

// Image host policy:
// 1. Pin signed listing image URLs to the private S3-compatible endpoint.
// 2. Include the virtual-hosted bucket hostname used by Railway/Tigris.
// 3. Always allow localhost / 127.0.0.1 for the dev MinIO setup on :9000.
const remotePatterns: RemotePattern[] = [
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
];

if (storagePatterns.length > 0) {
  remotePatterns.unshift(...storagePatterns);
} else {
  if (process.env.NODE_ENV === "production") {
    throw new Error("STORAGE_ENDPOINT is required in production");
  }
  remotePatterns.push({ protocol: "https", hostname: "**" });
}

// Build a Content-Security-Policy that stays compatible with Next.js RSC hydration
// and the same-origin API proxy under /api. Signed storage URLs are allowed only
// for the configured endpoint and its virtual-hosted bucket subdomains.
function buildContentSecurityPolicy() {
  const storageOrigin = (() => {
    try {
      const raw =
        process.env.STORAGE_ENDPOINT ??
        process.env.AWS_ENDPOINT_URL_S3 ??
        process.env.AWS_ENDPOINT_URL;
      if (!raw) return null;
      const url = new URL(raw);
      const exact = `${url.protocol}//${url.host}`;
      const virtual = process.env.STORAGE_FORCE_PATH_STYLE === "true"
        ? []
        : [`${url.protocol}//*.${url.host}`];
      return [exact, ...virtual];
    } catch {
      return null;
    }
  })();

  const imgSources = ["'self'", "data:", "blob:"];
  const connectSources = ["'self'"];
  if (storageOrigin) {
    imgSources.push(...storageOrigin);
    connectSources.push(...storageOrigin);
  } else if (process.env.NODE_ENV !== "production") {
    // Dev: allow the MinIO port and any https origin.
    imgSources.push("http://localhost:9000", "https:");
  } else {
    imgSources.push("https:");
  }

  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (process.env.NODE_ENV !== "production") {
    // Next dev overlay + HMR need eval in dev.
    scriptSources.push("'unsafe-eval'");
  }

  return [
    `default-src 'self'`,
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com`,
    `font-src 'self' fonts.gstatic.com data:`,
    `img-src ${imgSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ].join("; ");
}

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns,
  },
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry wrap — only active when @sentry/nextjs is installed. Kept behind
// require() so a fresh checkout typechecks + builds without the SDK. See
// docs/observability/sentry-wireup.md for the one-time install steps.
type NextConfigWrapper = (config: NextConfig, options?: unknown) => NextConfig;

function loadSentryWrapper(): NextConfigWrapper {
  try {
    const mod = require("@sentry/nextjs") as { withSentryConfig?: NextConfigWrapper };
    if (mod.withSentryConfig) return mod.withSentryConfig;
  } catch {
    // SDK not installed yet — no-op wrapper.
  }
  return (config) => config;
}

const withSentryConfig = loadSentryWrapper();

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  hideSourceMaps: true,
});
