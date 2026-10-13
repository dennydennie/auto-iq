import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { issueRemoteCsrfToken, proxyRemoteResponse, readSessionCookie,
  sendRemoteRequest, sessionRequiredResponse, storeSessionCookie } from "./remote-api";

export async function proxyAuth(request: Request, path: string, authenticated = false, createsSession = false) {
  const sessionCookie = authenticated ? await readSessionCookie(request) : null;
  if (authenticated && !sessionCookie) return sessionRequiredResponse();
  const csrfToken = sessionCookie && request.method !== "GET" ? await issueRemoteCsrfToken(sessionCookie) : null;
  if (authenticated && request.method !== "GET" && !csrfToken) return sessionRequiredResponse();
  const body = ["GET", "DELETE"].includes(request.method) ? undefined : await request.json().catch(() => null);
  if (body === null) return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  const remote = await sendRemoteRequest({ path, method: request.method, body, sessionCookie, csrfToken, clientIp: clientIp(request) });
  const result = await proxyRemoteResponse(remote);
  if (createsSession && remote.ok) storeSessionCookie(remote, result);
  return result;
}

function clientIp(request: Request) {
  const hops = Math.max(Number(process.env.WEB_TRUSTED_PROXY_HOPS ?? "1"), 1);
  const value = request.headers.get("x-forwarded-for")?.split(",").at(-hops)?.trim();
  return value && isIP(value) ? value : null;
}

export function authDestination(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : undefined;
}
