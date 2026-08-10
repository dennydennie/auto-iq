import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export async function getRequestLocale() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (savedLocale) return resolveLocale(savedLocale);

  const requestHeaders = await headers();
  return resolveLocale(requestHeaders.get("accept-language"));
}
