import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

const ACTIONS = {
  review: ROUTES.admin.quoteReview,
  accept: ROUTES.admin.quoteAccept,
  counter: ROUTES.admin.quoteCounter,
  decline: ROUTES.admin.quoteDecline,
} as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ quoteId: string; action: string }> },
) {
  const { quoteId, action } = await context.params;
  const pathBuilder = ACTIONS[action as keyof typeof ACTIONS];
  if (!pathBuilder)
    return NextResponse.json(
      {
        code: "RESOURCE_NOT_FOUND",
        message: "Quote action not found",
        correlationId: "",
        statusCode: 404,
      },
      { status: 404 },
    );
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();
  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();
  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "POST",
    path: pathBuilder(quoteId),
    body,
    sessionCookie,
    csrfToken,
  });
  return proxyRemoteResponse(response);
}
