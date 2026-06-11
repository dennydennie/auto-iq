import { NextRequest } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import { proxyRemoteResponse, sendRemoteRequest } from "@/lib/remote-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.auth.verifyOtp,
    body,
  });

  return proxyRemoteResponse(response);
}
