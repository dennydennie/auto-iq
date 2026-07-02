import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function parseStorageHost(): RemotePattern | null {
  const raw = process.env.STORAGE_PUBLIC_BASE_URL;
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return null;
    return {
      protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: "/**",
    };
  } catch {
    // Malformed URL — ignore and fall through to the looser default below.
    return null;
  }
}

const storagePattern = parseStorageHost();

// Image host policy:
// 1. When STORAGE_PUBLIC_BASE_URL is configured, pin the listing images to that
//    exact host (Tigris/MinIO/S3 endpoint). This is the production posture.
// 2. Always allow localhost / 127.0.0.1 for the dev MinIO setup on :9000.
// 3. As a deliberate dev fallback (env var unset) we keep `https://**` open so
//    seeded staging URLs render — but emit a build-time warning so production
//    deploys notice if STORAGE_PUBLIC_BASE_URL was forgotten.
const remotePatterns: RemotePattern[] = [
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
];

if (storagePattern) {
  remotePatterns.unshift(storagePattern);
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[next.config] STORAGE_PUBLIC_BASE_URL is unset in production — falling back to `https://**`. " +
        "Pin this to your storage host to lock down the next/image proxy.",
    );
  }
  remotePatterns.push({ protocol: "https", hostname: "**" });
}

// Build a Content-Security-Policy that stays compatible with Next.js RSC hydration
// and the same-origin API proxy under /api. When STORAGE_PUBLIC_BASE_URL is set we
// also allow it for images and (rarely) fetch. Broader hosts stay off by default.
function buildContentSecurityPolicy() {
  const storageOrigin = (() => {
    try {
      const raw = process.env.STORAGE_PUBLIC_BASE_URL;
      if (!raw) return null;
      const url = new URL(raw);
      return `${url.protocol}//${url.host}`;
    } catch {
      return null;
    }
  })();

  const imgSources = ["'self'", "data:", "blob:"];
  const connectSources = ["'self'"];
  if (storageOrigin) {
    imgSources.push(storageOrigin);
    connectSources.push(storageOrigin);
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
