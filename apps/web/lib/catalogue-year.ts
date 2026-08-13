export const CATALOGUE_YEAR_MAX = 2026;
export const CATALOGUE_YEAR_MIN = 1990;

export const CATALOGUE_YEAR_OPTIONS = Array.from(
  { length: CATALOGUE_YEAR_MAX - CATALOGUE_YEAR_MIN + 1 },
  (_, index) => CATALOGUE_YEAR_MAX - index,
);

export function yearOptions(...currentValues: string[]) {
  const options = new Set<number>(CATALOGUE_YEAR_OPTIONS);
  for (const value of currentValues) {
    const year = parseYear(value);
    if (year !== null) options.add(year);
  }
  return [...options].sort((left, right) => right - left);
}

export function isYearRangeValid(minimum: string, maximum: string) {
  const min = parseYear(minimum);
  const max = parseYear(maximum);
  return min === null || max === null || min <= max;
}

export function normalizeYearValue(value: string) {
  const year = parseYear(value);
  return year === null ? "" : String(year);
}

export function yearRangeLabel(minimum: string, maximum: string) {
  const min = parseYear(minimum);
  const max = parseYear(maximum);
  if (min !== null && max !== null) return `${min} – ${max}`;
  if (min !== null) return `From ${min}`;
  if (max !== null) return `Up to ${max}`;
  return "Any year";
}

function parseYear(value: string) {
  if (!value.trim()) return null;
  const year = Number(value);
  return Number.isSafeInteger(year) && year >= 1900 && year <= 2100
    ? year
    : null;
}
