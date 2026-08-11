import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function GET() {
  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const response = await sendRemoteRequest({
    method: "GET",
    path: ROUTES.me.profile,
    sessionCookie,
  });

  return proxyRemoteResponse(response);
}

export async function PATCH(request: Request) {
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();

  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "PATCH",
    path: ROUTES.me.profile,
    body,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
