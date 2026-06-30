import { ROUTES } from "@auto-iq/contracts/routes";
import {
  proxyRemoteResponse,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

export async function GET() {
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const response = await sendRemoteRequest({
    method: "GET",
    path: ROUTES.referenceData.all,
    sessionCookie,
  });

  return proxyRemoteResponse(response);
}
