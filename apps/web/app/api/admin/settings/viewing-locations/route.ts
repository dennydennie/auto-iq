import { ROUTES } from "@auto-iq/contracts/routes";
import { issueRemoteCsrfToken, proxyRemoteResponse, readSessionCookie, sendRemoteRequest, sessionRequiredResponse } from "@/lib/remote-api";

export async function POST(request: Request) {
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();
  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const body = await request.json().catch(() => undefined);
  return proxyRemoteResponse(await sendRemoteRequest({
    method: "POST",
    path: ROUTES.admin.viewingLocations,
    body,
    sessionCookie,
    csrfToken,
  }));
}
