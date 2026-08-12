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
  context: { params: Promise<{ requestId: string }> },
) {
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();
  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const { requestId } = await context.params;
  const body = await request.json().catch(() => undefined);
  return proxyRemoteResponse(
    await sendRemoteRequest({
      method: "PATCH",
      path: ROUTES.admin.accountDeletionRequest(requestId),
      body,
      sessionCookie,
      csrfToken,
    }),
  );
}
