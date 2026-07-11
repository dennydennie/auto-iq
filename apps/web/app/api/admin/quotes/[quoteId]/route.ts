import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ quoteId: string }> },
) {
  const { quoteId } = await context.params;
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();

  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "PATCH",
    path: ROUTES.admin.quote(quoteId),
    body,
    sessionCookie,
    csrfToken,
  });
  return proxyRemoteResponse(response);
}
