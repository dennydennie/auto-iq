const FALLBACK_SITE_URL = "https://web-staging-1017.up.railway.app";

function normalizeUrl(value: string) {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  const url = new URL(withProtocol);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function getSiteUrl() {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_WEB_URL ??
      process.env.WEB_BASE_URL ??
      process.env.VERCEL_URL ??
      FALLBACK_SITE_URL,
  );
}

export function absoluteSiteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
