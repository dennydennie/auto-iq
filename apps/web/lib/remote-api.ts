import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ApiError } from "@auto-iq/contracts/error";
import type { CsrfResponse } from "@auto-iq/contracts/identity";
import { API_ORIGIN } from "@/lib/api-origin";

const SESSION_COOKIE_NAME = "auto_iq_session";

type RemoteRequestOptions = {
  method?: string;
  path: string;
  body?: unknown;
  sessionCookie?: string | null;
  csrfToken?: string | null;
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

  return fetch(apiUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}

export async function issueRemoteCsrfToken(sessionCookie: string) {
  const response = await sendRemoteRequest({
    method: "GET",
    path: ROUTES.auth.csrf,
    sessionCookie,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CsrfResponse;
  return payload.token;
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

export function storeSessionCookie(response: Response, nextResponse: NextResponse) {
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
