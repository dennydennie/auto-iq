import { NextResponse } from "next/server";
import { proxyAuth } from "@/lib/auth-proxy";

type Context = { params: Promise<{ action?: string[] }> };
async function handle(request: Request, context: Context) {
  const action = (await context.params).action?.join("/") ?? "";
  const publicAction = request.method === "GET" && action === "config" ||
    request.method === "POST" && ["login/options", "login/verify"].includes(action);
  const privateAction = request.method === "GET" && !action ||
    request.method === "POST" && ["registration/options", "registration/verify"].includes(action) ||
    request.method === "DELETE" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(action);
  if (!publicAction && !privateAction) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuth(request, `/api/v1/auth/passkeys${action ? `/${action}` : ""}`, privateAction, action === "login/verify");
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
