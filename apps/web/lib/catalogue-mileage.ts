export const MILEAGE_OPTIONS_KM = [
  20_000, 40_000, 80_000, 100_000, 150_000, 200_000, 250_000, 300_000,
] as const;

export function mileageOptions(...currentValues: string[]) {
  const options = new Set<number>(MILEAGE_OPTIONS_KM);
  for (const value of currentValues) {
    const mileage = parseMileage(value);
    if (mileage !== null) options.add(mileage);
  }
  return [...options].sort((left, right) => left - right);
}

export function isMileageRangeValid(minimum: string, maximum: string) {
  const min = parseMileage(minimum);
  const max = parseMileage(maximum);
  return min === null || max === null || min <= max;
}

export function mileageRangeLabel(minimum: string, maximum: string) {
  const min = parseMileage(minimum);
  const max = parseMileage(maximum);
  if (min !== null && max !== null)
    return `${formatMileage(min)} – ${formatMileage(max)}`;
  if (min !== null) return `From ${formatMileage(min)}`;
  if (max !== null) return `Up to ${formatMileage(max)}`;
  return "Any mileage";
}

export function formatMileage(value: number) {
  return `${new Intl.NumberFormat("en-ZW").format(value)} km`;
}

function parseMileage(value: string) {
  if (!value.trim()) return null;
  const mileage = Number(value);
  return Number.isSafeInteger(mileage) && mileage >= 0 ? mileage : null;
}
