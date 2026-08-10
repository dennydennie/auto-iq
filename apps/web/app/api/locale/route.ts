import { NextRequest, NextResponse } from "next/server";
import {
  APP_LOCALES,
  LOCALE_COOKIE_NAME,
  normalizeReturnPath,
  type AppLocale,
} from "@/lib/i18n";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const locale = form.get("locale");
  if (!isAppLocale(locale)) {
    return NextResponse.json({ message: "Unsupported locale" }, { status: 400 });
  }

  const response = new NextResponse(null, {
    status: 303,
    headers: { location: normalizeReturnPath(form.get("returnTo")) },
  });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

function isAppLocale(value: FormDataEntryValue | null): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}
