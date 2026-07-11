import { NextRequest } from "next/server";
import { isIP } from "node:net";
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
    path: ROUTES.auth.login,
    body,
    clientIp: clientIp(request),
  });
  const response = await proxyRemoteResponse(remoteResponse);

  if (remoteResponse.ok) {
    storeSessionCookie(remoteResponse, response);
  }

  return response;
}

function clientIp(request: NextRequest) {
  const trustedHops = Math.max(
    Number(process.env.WEB_TRUSTED_PROXY_HOPS ?? "1"),
    1,
  );
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .at(-trustedHops)
    ?.trim();
  return forwarded && isIP(forwarded) ? forwarded : null;
}
