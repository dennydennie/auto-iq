import type { ApiError, ApiResult } from './error.js';

// ─── Token provider ───────────────────────────────────────────────────────────

export type TokenProvider = () => string | null | Promise<string | null>;
export type CsrfTokenProvider = () => string | null | Promise<string | null>;

// ─── Options ──────────────────────────────────────────────────────────────────

export interface ApiClientOptions {
  /** Base URL including origin, e.g. https://api.autoiq.co.zw */
  baseUrl: string;
  /** Cookie mode for browser session auth; defaults to `include` */
  credentials?: RequestCredentials;
  /** Called before each request; return the current access token or null */
  getToken?: TokenProvider;
  /** Called before unsafe cookie-authenticated requests */
  getCsrfToken?: CsrfTokenProvider;
  /**
   * Called when a 401 is received. Implement token refresh logic here.
   * Return the new access token, or null to signal the session is invalid.
   */
  onUnauthorized?: () => Promise<string | null>;
}

// ─── Request helpers ──────────────────────────────────────────────────────────

type QueryParamPrimitive = string | number | boolean;
type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[] | undefined | null;
type QueryParams = Record<string, QueryParamValue>;

function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .flatMap(([key, value]) => entries(key, value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

function entries(key: string, value: QueryParamValue): Array<[string, QueryParamPrimitive]> {
  if (value === undefined || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => [key, item]);
  }
  return [[key, value]];
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function unknownError(message: string, statusCode = 0): ApiError {
  return {
    code: 'INTERNAL_ERROR',
    message,
    correlationId: '',
    statusCode,
  };
}

async function parseError(res: Response): Promise<ApiError> {
  const correlationId = res.headers.get('x-correlation-id') ?? '';
  try {
    const body = await res.json();
    if (body && typeof body === 'object' && 'code' in body) {
      return { correlationId, statusCode: res.status, ...body } as ApiError;
    }
    return { ...unknownError(res.statusText, res.status), correlationId };
  } catch {
    return { ...unknownError(res.statusText, res.status), correlationId };
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ApiClient {
  private readonly baseUrl: string;
  private readonly credentials: RequestCredentials;
  private readonly getCsrfToken?: CsrfTokenProvider;
  private readonly getToken: TokenProvider;
  private readonly onUnauthorized?: ApiClientOptions['onUnauthorized'];

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.credentials = opts.credentials ?? 'include';
    this.getCsrfToken = opts.getCsrfToken;
    this.getToken = opts.getToken ?? (() => null);
    this.onUnauthorized = opts.onUnauthorized;
  }

  // ─── Core fetch ─────────────────────────────────────────────────────────────

  private async fetch<T>(
    method: string,
    path: string,
    opts?: {
      body?: unknown;
      query?: QueryParams;
      /** Skip auth header (e.g. login / register) */
      anonymous?: boolean;
      /** Skip CSRF header (e.g. GET /auth/csrf) */
      skipCsrf?: boolean;
      /** Already retried after 401 — prevent infinite loop */
      _retry?: boolean;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path}${buildQueryString(opts?.query)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!opts?.anonymous) {
      const token = await this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    if (isUnsafeMethod(method) && !opts?.skipCsrf && this.getCsrfToken) {
      const csrfToken = await this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        credentials: this.credentials,
        headers,
        body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (err) {
      return {
        ok: false,
        error: unknownError(err instanceof Error ? err.message : 'Network error'),
      };
    }

    // 401 → attempt refresh once
    if (res.status === 401 && !opts?._retry && this.onUnauthorized) {
      const newToken = await this.onUnauthorized();
      if (newToken) {
        return this.fetch<T>(method, path, { ...opts, _retry: true });
      }
    }

    if (!res.ok) {
      return { ok: false, error: await parseError(res) };
    }

    // 204 No Content
    if (res.status === 204) {
      return { ok: true, data: undefined as T };
    }

    try {
      const data: T = await res.json();
      return { ok: true, data };
    } catch {
      return { ok: false, error: unknownError('Failed to parse response body', res.status) };
    }
  }

  // ─── HTTP verbs ──────────────────────────────────────────────────────────────

  get<T>(path: string, query?: QueryParams, anonymous?: boolean): Promise<ApiResult<T>> {
    return this.fetch<T>('GET', path, { query, anonymous, skipCsrf: true });
  }

  post<T>(
    path: string,
    body?: unknown,
    opts?: { query?: QueryParams; anonymous?: boolean },
  ): Promise<ApiResult<T>> {
    return this.fetch<T>('POST', path, { body, ...opts });
  }

  patch<T>(
    path: string,
    body?: unknown,
    query?: QueryParams,
  ): Promise<ApiResult<T>> {
    return this.fetch<T>('PATCH', path, { body, query });
  }

  put<T>(
    path: string,
    body?: unknown,
    query?: QueryParams,
  ): Promise<ApiResult<T>> {
    return this.fetch<T>('PUT', path, { body, query });
  }

  delete<T = void>(path: string, query?: QueryParams): Promise<ApiResult<T>> {
    return this.fetch<T>('DELETE', path, { query });
  }
}

function isUnsafeMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}
