import type { ApiError, ApiResult } from "@auto-iq/contracts/error";

function unknownError(message: string, statusCode = 0): ApiError {
  return {
    code: "INTERNAL_ERROR",
    message,
    correlationId: "",
    statusCode,
  };
}

async function parseError(response: Response): Promise<ApiError> {
  const correlationId = response.headers.get("x-correlation-id") ?? "";

  try {
    const payload = (await response.json()) as ApiError;
    return {
      ...payload,
      correlationId: payload.correlationId || correlationId,
      statusCode: payload.statusCode || response.status,
    };
  } catch {
    return {
      ...unknownError(response.statusText || "Request failed", response.status),
      correlationId,
    };
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    return {
      ok: false,
      error: unknownError(error instanceof Error ? error.message : "Network error"),
    };
  }

  if (!response.ok) {
    return { ok: false, error: await parseError(response) };
  }

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  try {
    const payload = (await response.json()) as T;
    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      error: unknownError("Failed to parse response body", response.status),
    };
  }
}

export function getJson<T>(path: string) {
  return request<T>(path);
}

export function postJson<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function putJson<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function deleteJson<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export function isApiFailure<T>(
  result: ApiResult<T>,
): result is Extract<ApiResult<T>, { ok: false }> {
  return result.ok === false;
}
