import { NextResponse } from "next/server";
import { ROUTES } from "@auto-iq/contracts/routes";
import { proxyRemoteResponse, sendRemoteRequest } from "@/lib/remote-api";

const MAX_MAKE_LENGTH = 120;

export async function GET(request: Request) {
  const make = new URL(request.url).searchParams.get("make")?.trim() ?? "";
  if (!make || make.length > MAX_MAKE_LENGTH) return invalidMakeResponse();
  const query = new URLSearchParams({ make });
  return proxyRemoteResponse(
    await sendRemoteRequest({
      path: `${ROUTES.catalogue.modelFacets}?${query}`,
    }),
  );
}

function invalidMakeResponse() {
  return NextResponse.json(
    {
      code: "VALIDATION_FAILED",
      message: "A valid vehicle make is required",
      correlationId: "",
      statusCode: 400,
    },
    { status: 400 },
  );
}
