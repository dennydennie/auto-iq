import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOGUE_YEAR_OPTIONS,
  isYearRangeValid,
  normalizeYearValue,
  yearOptions,
  yearRangeLabel,
} from "./catalogue-year.ts";

test("provides every year from 2026 down to 1990", () => {
  assert.equal(CATALOGUE_YEAR_OPTIONS.length, 37);
  assert.deepEqual(CATALOGUE_YEAR_OPTIONS.slice(0, 3), [2026, 2025, 2024]);
  assert.equal(CATALOGUE_YEAR_OPTIONS.at(-1), 1990);
  assert.equal(
    CATALOGUE_YEAR_OPTIONS.every(
      (year, index) => index === 0 || year === CATALOGUE_YEAR_OPTIONS[index - 1] - 1,
    ),
    true,
  );
});

test("preserves valid legacy years in descending order", () => {
  const options = yearOptions("1985", "2027");
  assert.equal(options[0], 2027);
  assert.equal(options.at(-1), 1985);
});

test("validates, normalizes, and labels year ranges", () => {
  assert.equal(isYearRangeValid("2018", "2024"), true);
  assert.equal(isYearRangeValid("2025", "2020"), false);
  assert.equal(normalizeYearValue("02020"), "2020");
  assert.equal(normalizeYearValue("unknown"), "");
  assert.equal(yearRangeLabel("2018", "2024"), "2018 – 2024");
  assert.equal(yearRangeLabel("", "2020"), "Up to 2020");
});
