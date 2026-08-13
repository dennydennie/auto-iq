import { formatPrice } from "./format.ts";

export const PRICE_OPTIONS_USD = [
  2_000,
  3_000,
  5_000,
  6_000,
  7_000,
  8_000,
  9_000,
  10_000,
  15_000,
  20_000,
  25_000,
  30_000,
  35_000,
  40_000,
  45_000,
  50_000,
  60_000,
  70_000,
  80_000,
  90_000,
  100_000,
] as const;

export function priceOptions(...currentValues: string[]) {
  const options = new Set<number>(PRICE_OPTIONS_USD);
  for (const value of currentValues) {
    const price = parsePrice(value);
    if (price !== null) options.add(price);
  }
  return [...options].sort((left, right) => left - right);
}

export function isPriceRangeValid(minimum: string, maximum: string) {
  const min = parsePrice(minimum);
  const max = parsePrice(maximum);
  return min === null || max === null || min <= max;
}

export function normalizePriceValue(value: string) {
  const price = parsePrice(value);
  return price === null ? "" : String(price);
}

export function priceRangeLabel(minimum: string, maximum: string) {
  const min = parsePrice(minimum);
  const max = parsePrice(maximum);
  if (min !== null && max !== null)
    return `${formatPriceUsd(min)} – ${formatPriceUsd(max)}`;
  if (min !== null) return `From ${formatPriceUsd(min)}`;
  if (max !== null) return `Up to ${formatPriceUsd(max)}`;
  return "Any price";
}

export function formatPriceUsd(value: number) {
  return formatPrice(value, "USD");
}

function parsePrice(value: string) {
  if (!value.trim()) return null;
  const price = Number(value);
  return Number.isSafeInteger(price) && price >= 0 ? price : null;
}
