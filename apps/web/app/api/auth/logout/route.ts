import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
} from "@/lib/remote-api";

export async function POST() {
  const sessionCookie = await readSessionCookie();

  // If no session cookie is present, treat logout as a no-op success — the client
  // is already effectively signed out.
  if (!sessionCookie) {
    return NextResponse.json({ ok: true });
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.auth.logout,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
