import { timingSafeEqual, createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { ConfigService } from "@nestjs/config";
import type { CorrelatedRequest } from "../types/http";

export function resolveClientIp(request: CorrelatedRequest, config: ConfigService): string {
  const clientIp = header(request, "x-auto-iq-client-ip");
  const signature = header(request, "x-auto-iq-bff-signature");
  const secret = config.get<string>("BFF_SHARED_SECRET");
  if (!clientIp || !isIP(clientIp) || !signature || !secret) {
    return request.ip ?? "unknown";
  }
  const expected = createHmac("sha256", secret).update(clientIp).digest("hex");
  return signaturesMatch(signature, expected) ? clientIp : (request.ip ?? "unknown");
}

function header(request: CorrelatedRequest, name: string): string | undefined {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
