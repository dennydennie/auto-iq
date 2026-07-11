export interface CorrelatedRequest {
  correlationId?: string;
  cookies?: Record<string, string | undefined>;
  currentUser?: AuthenticatedUser;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  url?: string;
  originalUrl?: string;
  route?: { path?: string };
}

export interface HeaderResponse {
  setHeader(name: string, value: string): void;
}

export interface CookieResponse extends HeaderResponse {
  cookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(
    name: string,
    options: Pick<CookieOptions, "domain" | "path" | "sameSite" | "secure">,
  ): void;
  status(code: number): CookieResponse;
}

export interface CookieOptions {
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  sessionId: string;
}
