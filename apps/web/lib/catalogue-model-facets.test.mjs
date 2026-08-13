import assert from "node:assert/strict";
import test from "node:test";
import { parseModelFacets } from "./catalogue-model-facets.ts";

test("keeps unique models for the selected make", () => {
  const facets = parseModelFacets(
    [
      { make: " Toyota ", model: " Hilux ", count: 7 },
      { make: "Toyota", model: "hilux", count: 6 },
      { make: "Toyota", model: "Corolla", count: 2 },
      { make: "Honda", model: "Vezel", count: 1 },
      { make: "Toyota", model: "", count: 1 },
    ],
    "toyota",
  );

  assert.deepEqual(facets, [
    { make: "Toyota", model: "Hilux", count: 7 },
    { make: "Toyota", model: "Corolla", count: 2 },
  ]);
});

test("rejects a malformed model-facet response", () => {
  assert.throws(() => parseModelFacets({ data: [] }, "Toyota"), {
    name: "TypeError",
  });
});
