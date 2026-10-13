import { NextResponse } from "next/server";
import { proxyAuth } from "@/lib/auth-proxy";
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!["request", "verify"].includes(action)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuth(request, `/api/v1/auth/login-code/${action}`, false, action === "verify");
}
