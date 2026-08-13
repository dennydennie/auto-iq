import type { CatalogueModelFacet } from "@auto-iq/contracts/catalogue";

export function parseModelFacets(
  payload: unknown,
  selectedMake: string,
): CatalogueModelFacet[] {
  if (!Array.isArray(payload)) throw new TypeError("Invalid model response");
  const makeKey = selectedMake.trim().toLocaleLowerCase("en");
  const facets = payload
    .map(toModelFacet)
    .filter((facet): facet is CatalogueModelFacet => facet !== null)
    .filter((facet) => facet.make.toLocaleLowerCase("en") === makeKey);
  return uniqueModels(facets).sort(compareFacets);
}

function toModelFacet(value: unknown): CatalogueModelFacet | null {
  if (!isRecord(value)) return null;
  const make = text(value.make);
  const model = text(value.model);
  const count = Number(value.count);
  if (!make || !model || !Number.isSafeInteger(count) || count < 0) return null;
  return { make, model, count };
}

function uniqueModels(facets: CatalogueModelFacet[]) {
  const models = new Map<string, CatalogueModelFacet>();
  for (const facet of facets) {
    const key = facet.model.toLocaleLowerCase("en");
    const current = models.get(key);
    if (!current || current.count < facet.count) models.set(key, facet);
  }
  return [...models.values()];
}

function compareFacets(left: CatalogueModelFacet, right: CatalogueModelFacet) {
  return right.count - left.count || left.model.localeCompare(right.model);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
