import { NextRequest } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  proxyRemoteResponse,
  sendRemoteRequest,
  storeSessionCookie,
} from "@/lib/remote-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const remoteResponse = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.auth.verifyOtp,
    body,
  });
  const response = await proxyRemoteResponse(remoteResponse);

  if (remoteResponse.ok) {
    storeSessionCookie(remoteResponse, response);
  }

  return response;
}
