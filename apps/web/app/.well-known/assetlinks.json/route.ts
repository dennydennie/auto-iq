import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export function GET() {
  const fingerprints = (process.env.AUTO_IQ_ANDROID_CERT_FINGERPRINTS ?? "")
    .split(",").map(value => value.trim().toUpperCase()).filter(Boolean);
  if (fingerprints.some(value => !/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value))) {
    return NextResponse.json({ message: "Android association is not configured correctly." }, { status: 503 });
  }
  const statements = fingerprints.length ? [{
    relation: ["delegate_permission/common.handle_all_urls", "delegate_permission/common.get_login_creds"],
    target: { namespace: "android_app", package_name: "zw.co.bisell.autoiq.mobile", sha256_cert_fingerprints: fingerprints },
  }] : [];
  return NextResponse.json(statements, { headers: { "Cache-Control": "public, max-age=300" } });
}
