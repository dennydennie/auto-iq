const API_VERSION_PATH = "/api/v1";
const LOCAL_API_ORIGIN = "http://localhost:4000";
const STRICT_ENVIRONMENTS = new Set(["staging", "production"]);

export const API_ORIGIN = resolveApiOrigin();
export const API_ORIGIN_LABEL = new URL(API_ORIGIN).host;

function resolveApiOrigin() {
  const configured = firstConfiguredValue([
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ]);

  if (!configured) {
    if (STRICT_ENVIRONMENTS.has(process.env.NODE_ENV ?? "")) {
      throw new Error("API origin is required in staging and production");
    }
    return LOCAL_API_ORIGIN;
  }

  const url = parseApiOrigin(configured);
  if (STRICT_ENVIRONMENTS.has(process.env.NODE_ENV ?? "")) {
    assertSecureApiOrigin(url);
  }
  return url.origin;
}

function firstConfiguredValue(values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean);
}

function parseApiOrigin(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("API origin must be an absolute HTTP(S) URL");
  }

  const allowedPaths = new Set(["", "/", API_VERSION_PATH, `${API_VERSION_PATH}/`]);
  if (!allowedPaths.has(url.pathname) || url.search || url.hash || url.username || url.password) {
    throw new Error("API origin must not include a route, query, fragment, or credentials");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API origin must use HTTP or HTTPS");
  }
  return url;
}

function assertSecureApiOrigin(url: URL) {
  if (url.protocol !== "https:" || isLocalhost(url.hostname)) {
    throw new Error("API origin must be a non-localhost HTTPS URL in staging and production");
  }
}

function isLocalhost(hostname: string) {
  return new Set(["localhost", "127.0.0.1", "::1"]).has(hostname.toLowerCase());
}
