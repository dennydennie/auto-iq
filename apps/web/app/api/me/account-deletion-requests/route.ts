import { ROUTES } from "@auto-iq/contracts/routes";
import {
  clearSessionCookie,
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function POST(request: Request) {
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();
  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const body = await request.json().catch(() => undefined);
  const remoteResponse = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.me.accountDeletionRequests,
    body,
    sessionCookie,
    csrfToken,
  });
  const response = await proxyRemoteResponse(remoteResponse);
  if (remoteResponse.ok) clearSessionCookie(response);
  return response;
}
