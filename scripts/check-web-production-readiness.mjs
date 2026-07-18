import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const renderedFiles = [
  "apps/web/app/admin/page.tsx",
  "apps/web/app/admin/inspections/page.tsx",
  "apps/web/app/admin/reports/page.tsx",
  "apps/web/app/admin/requests/page.tsx",
  "apps/web/app/admin/settings/page.tsx",
  "apps/web/app/admin/users/page.tsx",
  "apps/web/app/admin/viewings/page.tsx",
  "apps/web/app/(marketplace)/vehicles/page.tsx",
  "apps/web/app/auth/reset-password/page.tsx",
  "apps/web/app/seller/page.tsx",
  "apps/web/app/seller/listings/[id]/page.tsx",
  "apps/web/app/seller/listings/new/page.tsx",
  "apps/web/components/seller/create-listing-form.tsx",
  "apps/web/components/seller/seller-dashboard.tsx",
];

const requiredRouteFiles = [
  "apps/web/app/admin/quotes/page.tsx",
  "apps/web/app/api/admin/quotes/[quoteId]/route.ts",
  "apps/web/app/api/admin/quotes/[quoteId]/[action]/route.ts",
  "apps/web/app/api/admin/vehicle-requests/[requestId]/route.ts",
  "apps/web/app/api/vehicle-requests/route.ts",
  "apps/web/app/api/inspector/tasks/[taskId]/report/route.ts",
  "apps/web/app/inspector/tasks/page.tsx",
  "apps/web/app/inspector/tasks/[id]/page.tsx",
  "apps/web/app/(marketplace)/requests/page.tsx",
  "apps/web/app/robots.ts",
  "apps/web/app/sitemap.ts",
  "apps/web/app/admin/login/page.tsx",
  "apps/web/app/api/auth/forgot-password/route.ts",
  "apps/web/app/api/auth/login/route.ts",
  "apps/web/app/api/auth/logout/route.ts",
  "apps/web/app/api/auth/otp/send/route.ts",
  "apps/web/app/api/auth/otp/verify/route.ts",
  "apps/web/app/api/auth/register/route.ts",
  "apps/web/app/api/auth/reset-password/route.ts",
  "apps/web/app/api/me/saved-vehicles/[listingId]/route.ts",
  "apps/web/app/api/me/consents/route.ts",
  "apps/web/app/api/seller/storage/images/presign/route.ts",
  "apps/web/app/api/seller/viewings/[viewingId]/seller-confirm/route.ts",
  "apps/web/app/seller/viewings/page.tsx",
  "apps/web/app/admin/notifications/page.tsx",
  "apps/web/app/api/admin/notifications/[notificationId]/retry/route.ts",
  "apps/web/proxy.ts",
];

const blockedPhrases = [
  "placeholder inventory",
  "placeholder counts",
  "coming soon",
  "This placeholder",
  "mock slots",
  "real database",
  "real API",
  "real admin",
  "staging API",
  "`apps/api`",
  "will appear",
  "Token state",
  "A reset token is present",
];

const requiredSourceFragments = [
  {
    file: "apps/web/app/api/auth/logout/route.ts",
    fragments: ["clearSessionCookie(response)"],
  },
  {
    file: "apps/web/app/api/auth/otp/verify/route.ts",
    fragments: ["storeSessionCookie(remoteResponse, response)"],
  },
  {
    file: "apps/web/app/api/auth/login/route.ts",
    fragments: ["clientIp: clientIp(request)", "WEB_TRUSTED_PROXY_HOPS"],
  },
  {
    file: "apps/web/lib/remote-api.ts",
    fragments: [
      "csrfCache",
      "csrfRequests",
      "response.status !== 403",
      "SESSION_TTL_SECONDS",
      "X-Auto-IQ-BFF-Signature",
      "WEB_API_TIMEOUT_MS",
      "fetchWithTimeout",
    ],
  },
  {
    file: "apps/web/app/api/admin/listings/[listingId]/[action]/route.ts",
    fragments: [
      "mark-reserved",
      "mark-sold",
      "inspection-tasks",
      "ownership-verification",
    ],
  },
  {
    file: "apps/web/components/admin/admin-listing-actions.tsx",
    fragments: [
      '"OWNERSHIP_VERIFICATION_PENDING"',
      'status === "APPROVED"',
      '"CHANGES_REQUESTED",',
      "canRequestChanges(status)",
      "canReject(status)",
    ],
  },
  {
    file: "apps/web/components/admin/admin-vehicle-request-actions.tsx",
    fragments: [
      'MATCH_FOUND: ["CANCELLED"]',
      "NO_MATCH: []",
      "CANCELLED: []",
      "allowedStatuses.length === 0",
    ],
  },
  {
    file: "apps/web/components/inspector/inspection-report-form.tsx",
    fragments: ['type="button"', "Add finding"],
  },
  {
    file: "apps/web/components/auth/record-consents-form.tsx",
    fragments: ['roles.includes("BUYER")', 'roles.includes("SELLER")'],
  },
  {
    file: "apps/web/app/(marketplace)/saved/page.tsx",
    fragments: ["SavedVehiclesPayload", "extractSavedVehicles(result.data)"],
  },
  {
    file: "apps/web/next.config.ts",
    fragments: [
      "STORAGE_ENDPOINT is required in production",
      "Missing production web observability configuration",
    ],
  },
  {
    file: "apps/web/lib/site-url.ts",
    fragments: ["NEXT_PUBLIC_SITE_URL is required in production"],
  },
];

const forbiddenSourceFragments = [
  {
    file: "apps/web/components/auth/login-form.tsx",
    fragments: [
      'params.set("phone"',
      '"PARTNER_ADMIN"',
      '"SYSTEM_ADMINISTRATOR"',
    ],
  },
  {
    file: "apps/web/components/marketplace/vehicle-interest-panel.tsx",
    fragments: ["live API", "API contracts", "result.data.id"],
  },
];

const failures = [];

for (const file of [".dockerignore"]) {
  if (!existsSync(join(ROOT, file)) || readFileSync(join(ROOT, file), "utf8").trim() === "") {
    failures.push(`${file}: release source ignore file must be present and non-empty`);
  }
}

for (const [route, files] of collectPageRoutes(join(ROOT, "apps/web/app"))) {
  if (files.length > 1) {
    failures.push(
      `${route}: duplicate page files (${files.map((file) => relative(ROOT, file)).join(", ")})`,
    );
  }
}

for (const file of requiredRouteFiles) {
  if (!existsSync(join(ROOT, file))) {
    failures.push(`${file}: required route is missing`);
  }
}

for (const file of renderedFiles) {
  const contents = readFileSync(join(ROOT, file), "utf8");

  for (const phrase of blockedPhrases) {
    if (contents.includes(phrase)) {
      failures.push(`${file}: ${phrase}`);
    }
  }
}

for (const check of requiredSourceFragments) {
  const contents = readFileSync(join(ROOT, check.file), "utf8");
  for (const fragment of check.fragments) {
    if (!contents.includes(fragment))
      failures.push(`${check.file}: missing ${fragment}`);
  }
}

for (const check of forbiddenSourceFragments) {
  const contents = readFileSync(join(ROOT, check.file), "utf8");
  for (const fragment of check.fragments) {
    if (contents.includes(fragment))
      failures.push(`${check.file}: contains ${fragment}`);
  }
}

if (failures.length > 0) {
  console.error("Rendered implementation artifacts found:");
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

function collectPageRoutes(directory, segments = [], routes = new Map()) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nextSegments = isRouteGroup(entry.name)
        ? segments
        : [...segments, normalizeRouteSegment(entry.name)];
      collectPageRoutes(path, nextSegments, routes);
      continue;
    }
    if (!/^page\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
    const route = `/${segments.join("/")}`.replace(/\/$/, "") || "/";
    const owners = routes.get(route) ?? [];
    owners.push(path);
    routes.set(route, owners);
  }
  return routes;
}

function isRouteGroup(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function normalizeRouteSegment(segment) {
  if (/^\[\[\.\.\..+\]\]$/.test(segment)) return "[[...param]]";
  if (/^\[\.\.\..+\]$/.test(segment)) return "[...param]";
  if (/^\[.+\]$/.test(segment)) return ":param";
  return segment;
}
