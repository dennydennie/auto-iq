const DEFAULT_API_ORIGIN = "https://api-staging-bdfe.up.railway.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export const API_ORIGIN = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_ORIGIN,
);

export const API_ORIGIN_LABEL = new URL(API_ORIGIN).host;
