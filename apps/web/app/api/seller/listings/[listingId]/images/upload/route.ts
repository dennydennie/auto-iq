import { NextRequest, NextResponse } from "next/server";
import type { ApiError } from "@auto-iq/contracts/error";
import type {
  ImagePresignRequest,
  ImagePresignResponse,
  VehicleImageDto,
} from "@auto-iq/contracts/storage";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  issueRemoteCsrfToken,
  readSessionCookie,
  sendRemoteRequest,
  sessionRequiredResponse,
} from "@/lib/remote-api";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function badRequest(message: string) {
  return NextResponse.json<ApiError>(
    { code: "INVALID_UPLOAD", correlationId: "", message, statusCode: 400 },
    { status: 400 },
  );
}

async function jsonOrError<T>(response: Response): Promise<T | NextResponse> {
  const payload = await response.json();
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }
  return payload as T;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  const sessionCookie = await readSessionCookie();
  if (!sessionCookie) {
    return sessionRequiredResponse();
  }

  const csrfToken = await issueRemoteCsrfToken(sessionCookie);
  if (!csrfToken) {
    return sessionRequiredResponse();
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const slot = formData.get("slot");
  const isCover = formData.get("isCover") === "true";

  if (!(file instanceof File)) {
    return badRequest("Choose a vehicle photo before uploading.");
  }
  if (typeof slot !== "string" || slot.length === 0) {
    return badRequest("Choose the photo view before uploading.");
  }
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return badRequest("Upload a JPEG, PNG, or WebP image.");
  }

  const presignBody: ImagePresignRequest = {
    contentLength: file.size,
    contentType: file.type as ImagePresignRequest["contentType"],
    slot: slot as ImagePresignRequest["slot"],
  };

  const presignResponse = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.storage.imagePresign,
    body: presignBody,
    sessionCookie,
    csrfToken,
  });
  const presign = await jsonOrError<ImagePresignResponse>(presignResponse);
  if (presign instanceof NextResponse) {
    return presign;
  }

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: await file.arrayBuffer(),
  });
  if (!uploadResponse.ok) {
    return NextResponse.json<ApiError>(
      {
        code: "STORAGE_UPLOAD_FAILED",
        correlationId: "",
        message: "The image upload to storage failed. Try a smaller file or another image.",
        statusCode: 502,
      },
      { status: 502 },
    );
  }

  const registerResponse = await sendRemoteRequest({
    method: "POST",
    path: ROUTES.storage.registerImage(listingId),
    body: { isCover, slot, storageKey: presign.storageKey },
    sessionCookie,
    csrfToken,
  });
  const registered = await jsonOrError<VehicleImageDto>(registerResponse);
  if (registered instanceof NextResponse) {
    return registered;
  }

  return NextResponse.json(registered);
}
