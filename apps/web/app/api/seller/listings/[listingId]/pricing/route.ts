import { NextRequest } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function PUT(
  request: NextRequest,
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

  const response = await sendRemoteRequest({
    method: "PUT",
    path: ROUTES.listings.upsertPricing(listingId),
    body: await request.json(),
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
