const currencyFormatter = new Intl.NumberFormat("en-ZW", {
  maximumFractionDigits: 0,
});

const kmFormatter = new Intl.NumberFormat("en-ZW", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-ZW", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatPrice(amount: number | string, currency = "ZWG") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${currency} ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatKm(km: number | string) {
  const value = typeof km === "string" ? Number(km) : km;
  return `${kmFormatter.format(Number.isFinite(value) ? value : 0)} km`;
}

export function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return dateFormatter.format(date);
}

export function formatPhone(e164: string) {
  const digits = e164.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+263")) {
    return digits;
  }

  const local = digits.slice(4);
  return `+263 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
}
