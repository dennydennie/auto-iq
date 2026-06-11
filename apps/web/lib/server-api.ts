import "server-only";

import type { ApiError } from "@auto-iq/contracts/error";
import { readSessionCookie, sendRemoteRequest } from "@/lib/remote-api";

type QueryValue = boolean | number | string | null | undefined;

export type ServerApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function isServerApiFailure<T>(
  result: ServerApiResult<T>,
): result is Extract<ServerApiResult<T>, { ok: false }> {
  return result.ok === false;
}

function authError(): ApiError {
  return {
    code: "SESSION_EXPIRED",
    message: "Authentication required",
    correlationId: "",
    statusCode: 401,
  };
}

function buildError(message: string, statusCode: number, correlationId: string): ApiError {
  return {
    code: "INTERNAL_ERROR",
    message,
    correlationId,
    statusCode,
  };
}

async function parseResponse<T>(response: Response): Promise<ServerApiResult<T>> {
  const correlationId = response.headers.get("x-correlation-id") ?? "";

  if (!response.ok) {
    try {
      const payload = (await response.json()) as ApiError;
      return {
        ok: false,
        error: {
          ...payload,
          correlationId: payload.correlationId || correlationId,
          statusCode: payload.statusCode || response.status,
        },
      };
    } catch {
      return {
        ok: false,
        error: buildError(response.statusText || "Request failed", response.status, correlationId),
      };
    }
  }

  try {
    const payload = (await response.json()) as T;
    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      error: buildError("Failed to parse API response", response.status, correlationId),
    };
  }
}

export function withQuery(path: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export async function getPublicJson<T>(path: string): Promise<ServerApiResult<T>> {
  try {
    const response = await sendRemoteRequest({ path });
    return parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      error: buildError(error instanceof Error ? error.message : "Network error", 0, ""),
    };
  }
}

export async function getSessionJson<T>(path: string): Promise<ServerApiResult<T>> {
  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return { ok: false, error: authError() };
  }

  try {
    const response = await sendRemoteRequest({
      path,
      sessionCookie,
    });

    return parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      error: buildError(error instanceof Error ? error.message : "Network error", 0, ""),
    };
  }
}

export async function getOptionalSessionJson<T>(path: string): Promise<ServerApiResult<T> | null> {
  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return null;
  }

  try {
    const response = await sendRemoteRequest({
      path,
      sessionCookie,
    });

    return parseResponse<T>(response);
  } catch (error) {
    return {
      ok: false,
      error: buildError(error instanceof Error ? error.message : "Network error", 0, ""),
    };
  }
}
