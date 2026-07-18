import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, createHmac } from "node:crypto";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ApiError } from "@auto-iq/contracts/error";
import type { CsrfResponse } from "@auto-iq/contracts/identity";
import { API_ORIGIN } from "@/lib/api-origin";

const SESSION_COOKIE_NAME = "auto_iq_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const CSRF_CACHE_TTL_MS = 105 * 60 * 1000;
const MAX_CSRF_CACHE_ENTRIES = 1_000;
const DEFAULT_API_TIMEOUT_MS = 10_000;
const csrfCache = new Map<string, { token: string; expiresAt: number }>();
const csrfRequests = new Map<string, Promise<string | null>>();

type RemoteRequestOptions = {
  method?: string;
  path: string;
  body?: unknown;
  sessionCookie?: string | null;
  csrfToken?: string | null;
  clientIp?: string | null;
};

function apiUrl(path: string) {
  return `${API_ORIGIN}${path}`;
}

function cookieHeader(sessionCookie: string | null | undefined) {
  return sessionCookie ? `${SESSION_COOKIE_NAME}=${sessionCookie}` : undefined;
}

function secureCookies() {
  return process.env.NODE_ENV === "production";
}

function sessionExpiredError(): ApiError {
  return {
    code: "SESSION_EXPIRED",
    message: "Authentication required",
    correlationId: "",
    statusCode: 401,
  };
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function sendRemoteRequest({
  method = "GET",
  path,
  body,
  sessionCookie,
  csrfToken,
  clientIp,
}: RemoteRequestOptions) {
  const headers = new Headers({ Accept: "application/json" });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const cookie = cookieHeader(sessionCookie);
  if (cookie) {
    headers.set("Cookie", cookie);
  }

  if (csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  attachClientIp(headers, clientIp);

  const response = await fetchWithTimeout(apiUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status !== 403 || !sessionCookie || !csrfToken) {
    return response;
  }

  invalidateRemoteCsrfToken(sessionCookie);
  const refreshedToken = await issueRemoteCsrfToken(sessionCookie);
  if (!refreshedToken) return response;
  headers.set("X-CSRF-Token", refreshedToken);
  return fetchWithTimeout(apiUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}

async function fetchWithTimeout(input: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = configuredApiTimeoutMs();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function configuredApiTimeoutMs() {
  const value = Number(process.env.WEB_API_TIMEOUT_MS ?? DEFAULT_API_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 250 ? value : DEFAULT_API_TIMEOUT_MS;
}

function attachClientIp(headers: Headers, clientIp: string | null | undefined) {
  const secret = process.env.BFF_SHARED_SECRET;
  if (!clientIp || !secret) return;
  const signature = createHmac("sha256", secret).update(clientIp).digest("hex");
  headers.set("X-Auto-IQ-Client-IP", clientIp);
  headers.set("X-Auto-IQ-BFF-Signature", signature);
}

export async function issueRemoteCsrfToken(sessionCookie: string) {
  const cached = cachedCsrfToken(sessionCookie);
  if (cached) return cached;
  const key = sessionCacheKey(sessionCookie);
  const pending = csrfRequests.get(key);
  if (pending) return pending;
  const request = fetchRemoteCsrfToken(sessionCookie);
  csrfRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (csrfRequests.get(key) === request) csrfRequests.delete(key);
  }
}

async function fetchRemoteCsrfToken(sessionCookie: string) {
  const response = await sendRemoteRequest({
    method: "GET",
    path: ROUTES.auth.csrf,
    sessionCookie,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CsrfResponse;
  cacheCsrfToken(sessionCookie, payload.token);
  return payload.token;
}

function cachedCsrfToken(sessionCookie: string) {
  const key = sessionCacheKey(sessionCookie);
  const cached = csrfCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    csrfCache.delete(key);
    return null;
  }
  return cached.token;
}

function cacheCsrfToken(sessionCookie: string, token: string) {
  if (csrfCache.size >= MAX_CSRF_CACHE_ENTRIES) {
    csrfCache.delete(csrfCache.keys().next().value ?? "");
  }
  csrfCache.set(sessionCacheKey(sessionCookie), {
    token,
    expiresAt: Date.now() + CSRF_CACHE_TTL_MS,
  });
}

function invalidateRemoteCsrfToken(sessionCookie: string) {
  csrfCache.delete(sessionCacheKey(sessionCookie));
}

function sessionCacheKey(sessionCookie: string) {
  return createHash("sha256").update(sessionCookie).digest("hex");
}

export async function proxyRemoteResponse(response: Response) {
  const correlationId = response.headers.get("x-correlation-id");
  const headers = new Headers();

  if (correlationId) {
    headers.set("x-correlation-id", correlationId);
  }

  const contentType = response.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (response.status === 204) {
    return new NextResponse(null, {
      status: response.status,
      headers,
    });
  }

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}

export function storeSessionCookie(
  response: Response,
  nextResponse: NextResponse,
) {
  const setCookie = response.headers.get("set-cookie");
  const match = setCookie?.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));

  if (!match) {
    return;
  }

  nextResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: match[1],
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(nextResponse: NextResponse) {
  nextResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: 0,
  });
}

export function sessionRequiredResponse() {
  return NextResponse.json(sessionExpiredError(), { status: 401 });
}
