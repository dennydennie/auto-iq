import assert from "node:assert/strict";
import test from "node:test";
import {
  PRICE_OPTIONS_USD,
  isPriceRangeValid,
  normalizePriceValue,
  priceOptions,
  priceRangeLabel,
} from "./catalogue-price.ts";

test("provides the requested USD price bands", () => {
  assert.deepEqual(
    [...PRICE_OPTIONS_USD],
    [
      2_000, 3_000, 5_000, 6_000, 7_000, 8_000, 9_000, 10_000, 15_000,
      20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 60_000,
      70_000, 80_000, 90_000, 100_000,
    ],
  );
});

test("preserves a valid legacy price in sorted options", () => {
  assert.deepEqual(priceOptions("12500", "15000").slice(0, 10), [
    2_000, 3_000, 5_000, 6_000, 7_000, 8_000, 9_000, 10_000, 12_500,
    15_000,
  ]);
});

test("validates and labels complete or open price ranges", () => {
  assert.equal(isPriceRangeValid("5000", "20000"), true);
  assert.equal(isPriceRangeValid("30000", "20000"), false);
  assert.equal(priceRangeLabel("5000", "20000"), "USD 5,000 – USD 20,000");
  assert.equal(priceRangeLabel("", "10000"), "Up to USD 10,000");
});

test("normalizes valid URL values and removes malformed values", () => {
  assert.equal(normalizePriceValue("0012500"), "12500");
  assert.equal(normalizePriceValue("unknown"), "");
  assert.equal(normalizePriceValue("-1"), "");
});
