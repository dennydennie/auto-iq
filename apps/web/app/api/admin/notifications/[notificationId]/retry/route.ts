import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function POST(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await context.params;
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.admin.notificationRetry(notificationId),
    sessionCookie,
    csrfToken,
  });
  return proxyRemoteResponse(response);
}
