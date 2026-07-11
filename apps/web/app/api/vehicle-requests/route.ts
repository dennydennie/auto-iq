import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function GET() {
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();

  const response = await sendRemoteRequest({
    path: ROUTES.vehicleRequests.buyerList,
    sessionCookie,
  });
  return proxyRemoteResponse(response);
}

export async function POST(request: Request) {
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) return sessionRequiredResponse();

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) return sessionRequiredResponse();

  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.vehicleRequests.create,
    body,
    sessionCookie,
    csrfToken,
  });
  return proxyRemoteResponse(response);
}
