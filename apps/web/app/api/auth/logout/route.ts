import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  clearSessionCookie,
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
} from "@/lib/remote-api";

export async function POST() {
  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return clearedResponse(204);
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  const remoteResponse = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.auth.logout,
    sessionCookie,
    csrfToken,
  });
  const response = await proxyRemoteResponse(remoteResponse);
  clearSessionCookie(response);
  return response;
}

function clearedResponse(status: number) {
  const response = new NextResponse(null, { status });
  clearSessionCookie(response);
  return response;
}
