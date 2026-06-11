import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);

  if (!csrfToken) {
    return sessionRequiredResponse();
  }

  const body = await request.json();
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.viewings.create(listingId),
    body,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
