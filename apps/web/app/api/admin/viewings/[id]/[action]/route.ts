import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

type ActionName = "confirm" | "reschedule" | "cancel" | "complete";

const ACTION_PATHS: Record<ActionName, (viewingId: string) => string> = {
  confirm: ROUTES.admin.viewingConfirm,
  reschedule: ROUTES.admin.viewingReschedule,
  cancel: ROUTES.admin.viewingCancel,
  complete: ROUTES.admin.viewingComplete,
};

function resolveAction(action: string) {
  return ACTION_PATHS[action as ActionName] ?? null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string; id: string }> },
) {
  const { action, id } = await context.params;
  const pathBuilder = resolveAction(action);

  if (!pathBuilder) {
    return NextResponse.json(
      {
        code: "RESOURCE_NOT_FOUND",
        message: "Viewing action not found",
        correlationId: "",
        statusCode: 404,
      },
      { status: 404 },
    );
  }

  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();

  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "POST",
    path: pathBuilder(id),
    body,
    sessionCookie,
    csrfToken,
  });

  return proxyRemoteResponse(response);
}
