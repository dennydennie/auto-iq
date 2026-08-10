import { DEFAULT_LOCALE, type AppLocale } from "./i18n.ts";

export function formatPrice(
  amount: number | string,
  currency = "ZWG",
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${formatNumber(value, locale)}`;
}

export function formatKm(km: number | string, locale: AppLocale = DEFAULT_LOCALE) {
  const value = typeof km === "string" ? Number(km) : km;
  return `${formatNumber(value, locale)} km`;
}

export function formatDate(isoDate: string, locale: AppLocale = DEFAULT_LOCALE) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatNumber(value: number, locale: AppLocale = DEFAULT_LOCALE) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(safeValue);
}

export function formatPhone(e164: string) {
  const digits = e164.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+263")) {
    return digits;
  }

  const local = digits.slice(4);
  return `+263 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
}
