import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
    method: "PUT",
    path: ROUTES.listings.upsertPricing(id),
    body,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
