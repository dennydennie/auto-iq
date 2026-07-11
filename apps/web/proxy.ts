import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "auto_iq_session";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }
  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/inspector/:path*",
    "/saved",
    "/quotes",
    "/requests",
    "/viewings",
  ],
};
