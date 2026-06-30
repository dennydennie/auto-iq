import { NextRequest } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function POST(request: NextRequest) {
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) {
    return sessionRequiredResponse();
  }

  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.referenceData.makes,
    body: await request.json(),
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
