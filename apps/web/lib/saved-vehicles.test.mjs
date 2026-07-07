import assert from "node:assert/strict";
import test from "node:test";
import { extractSavedVehicles } from "./saved-vehicles.ts";

const savedEntry = {
  id: "saved-1",
  savedAt: "2026-07-07T10:00:00.000Z",
  listing: {
    id: "listing-1",
    slug: "2022-mazda-cx-5",
    year: 2022,
    make: "Mazda",
    model: "CX-5",
    bodyType: "SUV",
    askPriceUsd: 22900,
    negotiable: true,
    city: "Harare",
    coverImageUrl: null,
    bisellVerified: true,
    inspectionScore: 88,
    daysListed: 2,
  },
};

test("extracts saved vehicles from the paged API response", () => {
  const result = extractSavedVehicles({
    data: [savedEntry],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  });

  assert.deepEqual(
    result.map((entry) => entry.listing.id),
    ["listing-1"],
  );
});

test("keeps legacy array responses safe for existing callers", () => {
  const result = extractSavedVehicles([savedEntry]);

  assert.deepEqual(
    result.map((entry) => entry.id),
    ["saved-1"],
  );
});
