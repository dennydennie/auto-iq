import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

async function forwardMutation(
  method: "POST" | "DELETE",
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  const sessionCookie = await readSessionCookie(request);
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();

  const response = await sendRemoteRequest({
    method,
    path: ROUTES.me.savedVehicle(listingId),
    sessionCookie,
    csrfToken,
  });
  return proxyRemoteResponse(response);
}

export function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  return forwardMutation("POST", request, context);
}

export function DELETE(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  return forwardMutation("DELETE", request, context);
}
