import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

type ActionName = "approve" | "publish" | "reject" | "request-changes";

const ACTION_PATHS: Record<ActionName, (listingId: string) => string> = {
  approve: ROUTES.admin.listingApprove,
  publish: ROUTES.admin.listingPublish,
  reject: ROUTES.admin.listingReject,
  "request-changes": ROUTES.admin.listingRequestChanges,
};

function resolveAction(action: string) {
  return ACTION_PATHS[action as ActionName] ?? null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string; listingId: string }> },
) {
  const { action, listingId } = await context.params;
  const pathBuilder = resolveAction(action);

  if (!pathBuilder) {
    return NextResponse.json(
      {
        code: "RESOURCE_NOT_FOUND",
        message: "Admin action not found",
        correlationId: "",
        statusCode: 404,
      },
      { status: 404 },
    );
  }

  const sessionCookie = await readSessionCookie();

  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);

  if (!csrfToken) {
    return sessionRequiredResponse();
  }

  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "POST",
    path: pathBuilder(listingId),
    body,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
