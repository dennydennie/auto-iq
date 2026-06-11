interface SentryEventLike {
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, unknown>;
    url?: string;
  };
}

const SENSITIVE_ROUTE_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/storage",
  "/api/v1/listings/",
];

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-csrf-token",
]);

export function scrubSentryEvent(event: SentryEventLike): SentryEventLike | null {
  delete event.request?.cookies;
  scrubHeaders(event.request?.headers);

  const url = event.request?.url ?? "";
  if (isSensitiveRoute(url)) {
    delete event.request?.data;
  }

  return event;
}

function isSensitiveRoute(url: string): boolean {
  return SENSITIVE_ROUTE_PREFIXES.some((prefix) => url.includes(prefix));
}

function scrubHeaders(headers: Record<string, unknown> | undefined): void {
  if (!headers) {
    return;
  }

  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      delete headers[key];
    }
  }
}
