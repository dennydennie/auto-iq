import { ROUTES } from "@auto-iq/contracts/routes";
import { issueRemoteCsrfToken, proxyRemoteResponse, readSessionCookie, sendRemoteRequest, sessionRequiredResponse } from "@/lib/remote-api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ optionId: string }> },
) {
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();
  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const { optionId } = await context.params;
  const body = await request.json().catch(() => undefined);
  return proxyRemoteResponse(await sendRemoteRequest({
    method: "PATCH",
    path: ROUTES.admin.referenceOption(optionId),
    body,
    sessionCookie,
    csrfToken,
  }));
}
