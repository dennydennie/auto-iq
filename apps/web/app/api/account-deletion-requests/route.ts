import { isIP } from "node:net";
import { NextRequest } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import { proxyRemoteResponse, sendRemoteRequest } from "@/lib/remote-api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.accountDeletionRequests.create,
    body,
    clientIp: clientIp(request),
  });
  return proxyRemoteResponse(response);
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
