import assert from "node:assert/strict";
import test from "node:test";
import {
  MILEAGE_OPTIONS_KM,
  isMileageRangeValid,
  mileageOptions,
  mileageRangeLabel,
} from "./catalogue-mileage.ts";

test("provides the requested mileage bands", () => {
  assert.deepEqual(
    [...MILEAGE_OPTIONS_KM],
    [20_000, 40_000, 80_000, 100_000, 150_000, 200_000, 250_000, 300_000],
  );
});

test("preserves a valid legacy mileage value in sorted options", () => {
  assert.deepEqual(
    mileageOptions("50000", "100000"),
    [
      20_000, 40_000, 50_000, 80_000, 100_000, 150_000, 200_000, 250_000,
      300_000,
    ],
  );
});

test("validates and labels complete or open mileage ranges", () => {
  assert.equal(isMileageRangeValid("40000", "100000"), true);
  assert.equal(isMileageRangeValid("150000", "100000"), false);
  assert.equal(mileageRangeLabel("40000", "100000"), "40,000 km – 100,000 km");
  assert.equal(mileageRangeLabel("", "80000"), "Up to 80,000 km");
});
