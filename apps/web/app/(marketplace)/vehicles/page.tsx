import Link from "next/link";
import type {
  CatalogueMakeFacetsResponse,
  CatalogueResponse,
  SavedVehicleDto,
} from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Lock, Search, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { FilterSidebar, type CatalogueFilterState } from "@/components/marketplace/filter-sidebar";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FilterChips, type FilterChip } from "@/components/shared/filter-chips";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getOptionalSessionJson, getPublicJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Filters = CatalogueFilterState & { cursor: string };

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function filtersToQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.make) params.set("make", filters.make);
  if (filters.city) params.set("city", filters.city);
  if (filters.bodyType) params.set("bodyType", filters.bodyType);
  if (filters.fuelType) params.set("fuelType", filters.fuelType);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.verified) params.set("verified", filters.verified);
  if (filters.yearMin) params.set("yearMin", filters.yearMin);
  if (filters.yearMax) params.set("yearMax", filters.yearMax);
  if (filters.priceMin) params.set("priceMin", filters.priceMin);
  if (filters.priceMax) params.set("priceMax", filters.priceMax);
  if (filters.mileageMax) params.set("mileageMax", filters.mileageMax);
  if (filters.sortBy && filters.sortBy !== "publishedAt") params.set("sortBy", filters.sortBy);
  if (filters.cursor) params.set("cursor", filters.cursor);
  return params.toString();
}

function vehiclesHref(overrides: Partial<Filters>, current: Filters) {
  const query = filtersToQuery({ ...current, ...overrides });
  return query ? `/vehicles?${query}` : "/vehicles";
}

function activeFilterCount(filters: Filters) {
  let count = 0;
  if (filters.make) count++;
  if (filters.city) count++;
  if (filters.bodyType) count++;
  if (filters.fuelType) count++;
  if (filters.transmission) count++;
  if (filters.verified) count++;
  if (filters.yearMin || filters.yearMax) count++;
  if (filters.priceMin || filters.priceMax) count++;
  if (filters.mileageMax) count++;
  return count;
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters: Filters = {
    make: readValue(params.make),
    city: readValue(params.city),
    bodyType: readValue(params.bodyType),
    fuelType: readValue(params.fuelType),
    transmission: readValue(params.transmission),
    verified: readValue(params.verified),
    yearMin: readValue(params.yearMin),
    yearMax: readValue(params.yearMax),
    priceMin: readValue(params.priceMin),
    priceMax: readValue(params.priceMax),
    mileageMax: readValue(params.mileageMax),
    sortBy: readValue(params.sortBy) || "publishedAt",
    cursor: readValue(params.cursor),
  };

  const cataloguePath = withQuery(ROUTES.catalogue.list, {
    limit: 24,
    cursor: filters.cursor,
    city: filters.city,
    make: filters.make,
    bodyType: filters.bodyType,
    fuelType: filters.fuelType,
    transmission: filters.transmission,
    yearMin: filters.yearMin ? Number(filters.yearMin) : undefined,
    yearMax: filters.yearMax ? Number(filters.yearMax) : undefined,
    priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
    priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
    mileageMax: filters.mileageMax ? Number(filters.mileageMax) : undefined,
    sortBy: filters.sortBy,
    sortDir: "DESC",
    bisellVerified: filters.verified === "true" ? true : undefined,
  });

  const [catalogueResult, meResult, savedResult, makesResult] = await Promise.all([
    getPublicJson<CatalogueResponse>(cataloguePath),
    getOptionalSessionJson<MeResponse>(ROUTES.me.profile),
    getOptionalSessionJson<SavedVehicleDto[]>(ROUTES.me.savedVehicles),
    getPublicJson<CatalogueMakeFacetsResponse>(ROUTES.catalogue.makeFacets),
  ]);

  const makes = !isServerApiFailure(makesResult) ? makesResult.data : [];

  const signedIn = meResult !== null && meResult.ok;
  const savedIds = new Set(
    savedResult !== null && savedResult.ok
      ? savedResult.data.map((entry) => entry.listing.id)
      : [],
  );

  const chips: FilterChip[] = [];
  if (filters.make) chips.push({ label: `Make: ${filters.make}`, removeHref: vehiclesHref({ make: "", cursor: "" }, filters) });
  if (filters.city) chips.push({ label: `City: ${filters.city}`, removeHref: vehiclesHref({ city: "", cursor: "" }, filters) });
  if (filters.bodyType) chips.push({ label: `Body: ${labelizeEnum(filters.bodyType)}`, removeHref: vehiclesHref({ bodyType: "", cursor: "" }, filters) });
  if (filters.fuelType) chips.push({ label: `Fuel: ${labelizeEnum(filters.fuelType)}`, removeHref: vehiclesHref({ fuelType: "", cursor: "" }, filters) });
  if (filters.transmission) chips.push({ label: `Transmission: ${labelizeEnum(filters.transmission)}`, removeHref: vehiclesHref({ transmission: "", cursor: "" }, filters) });
  if (filters.verified === "true") chips.push({ label: "BiSell verified", removeHref: vehiclesHref({ verified: "", cursor: "" }, filters) });
  if (filters.yearMin || filters.yearMax) {
    const label = `Year ${filters.yearMin || "any"} – ${filters.yearMax || "any"}`;
    chips.push({ label, removeHref: vehiclesHref({ yearMin: "", yearMax: "", cursor: "" }, filters) });
  }
  if (filters.priceMin || filters.priceMax) {
    const label = `Price $${filters.priceMin || "0"} – $${filters.priceMax || "∞"}`;
    chips.push({ label, removeHref: vehiclesHref({ priceMin: "", priceMax: "", cursor: "" }, filters) });
  }
  if (filters.mileageMax) {
    chips.push({ label: `≤ ${filters.mileageMax} km`, removeHref: vehiclesHref({ mileageMax: "", cursor: "" }, filters) });
  }

  const resultsCount = !isServerApiFailure(catalogueResult) ? catalogueResult.data.data.length : 0;
  const filterCount = activeFilterCount(filters);
  const listQuery = filtersToQuery({ ...filters, cursor: "" });
  const returnHref = listQuery ? `/vehicles?${listQuery}` : "/vehicles";

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      {signedIn ? (
        // Compact workspace-style header for returning buyers
        <PageHeader
          eyebrow="Live catalogue"
          title="Browse vehicles"
          description="Filter by make, city, price, year, and more. Contact a seller directly from any listing."
          actions={
            <form className="flex items-center gap-2">
              <input type="hidden" name="sortBy" value={filters.sortBy} />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
                <Input
                  name="make"
                  defaultValue={filters.make}
                  placeholder="Search make"
                  className="h-10 pl-9"
                />
              </div>
              <button className={buttonVariants({ variant: "amber", size: "sm" })}>Search</button>
            </form>
          }
        />
      ) : (
        // Full marketing hero for first-time visitors — this is the landing surface
        <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(255,205,83,0.22),transparent_40%),linear-gradient(180deg,#18233e_0%,#0a1e4d_100%)] px-6 py-8 text-white shadow-[0_30px_100px_-40px_rgba(10,30,77,0.65)] sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <Badge
                variant="amber"
                className="border-none bg-white/10 text-[#FFC72C]"
              >
                Live catalogue
              </Badge>
              <h1 className="display mt-4 text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                Inspected vehicles. Verified sellers.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                Browse every available vehicle on BiSell AutoIQ. Seller contact details
                and viewing bookings unlock when you sign in.
              </p>

              <form className="mt-5 flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
                <input type="hidden" name="sortBy" value={filters.sortBy} />
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
                  <Input
                    name="make"
                    defaultValue={filters.make}
                    placeholder="Search make (e.g. Toyota)"
                    className="h-11 border-none bg-white pl-9 text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
                  />
                </div>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
                  <Input
                    name="city"
                    defaultValue={filters.city}
                    placeholder="City (e.g. Harare)"
                    className="h-11 border-none bg-white pl-9 text-[var(--ink-900)] placeholder:text-[var(--ink-400)]"
                  />
                </div>
                <button className={buttonVariants({ variant: "amber", className: "h-11 px-6" })}>
                  Search
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/55">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Contact details locked
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/auth/login?next=/vehicles"
                    className={buttonVariants({ variant: "amber", size: "sm" })}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup?role=buyer&next=/vehicles"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "border-white/30 bg-white/5 text-white hover:bg-white/10",
                    })}
                  >
                    Create buyer account
                  </Link>
                </div>
              </div>
            </div>

            {/* Trust signals — three short rows */}
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#FFC72C]" aria-hidden="true" />
                <span className="text-white/80">Every listing inspected</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Sparkles className="h-4 w-4 shrink-0 text-[#FFC72C]" aria-hidden="true" />
                <span className="text-white/80">Verified sellers only</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-[#FFC72C]" aria-hidden="true" />
                <span className="text-white/80">Spam-free contact</span>
              </li>
            </ul>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <FilterSidebar
              filters={filters}
              clearHref="/vehicles"
              makes={makes}
              buildMakeHref={(make) => vehiclesHref({ make, cursor: "" }, filters)}
            />
          </div>
        </div>

        <div className="space-y-5">
          {/* Mobile filter trigger + toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <details className="relative lg:hidden">
                <summary className={buttonVariants({ variant: "outline", className: "cursor-pointer list-none" })}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters{filterCount > 0 ? ` (${filterCount})` : ""}
                </summary>
                <div className="absolute left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))]">
                  <FilterSidebar
                    filters={filters}
                    clearHref="/vehicles"
                    makes={makes}
                    buildMakeHref={(make) => vehiclesHref({ make, cursor: "" }, filters)}
                  />
                </div>
              </details>
              <p className="text-sm text-[var(--ink-500)]">
                {isServerApiFailure(catalogueResult) ? (
                  "Unable to load results"
                ) : (
                  <>
                    Showing <span className="font-semibold text-[var(--ink-900)]">{resultsCount}</span>{" "}
                    {resultsCount === 1 ? "vehicle" : "vehicles"}
                    {filterCount > 0 ? " matching your filters" : ""}
                  </>
                )}
              </p>
            </div>

            <form className="flex items-center gap-2">
              <input type="hidden" name="make" value={filters.make} />
              <input type="hidden" name="city" value={filters.city} />
              <input type="hidden" name="bodyType" value={filters.bodyType} />
              <input type="hidden" name="fuelType" value={filters.fuelType} />
              <input type="hidden" name="transmission" value={filters.transmission} />
              <input type="hidden" name="verified" value={filters.verified} />
              <input type="hidden" name="yearMin" value={filters.yearMin} />
              <input type="hidden" name="yearMax" value={filters.yearMax} />
              <input type="hidden" name="priceMin" value={filters.priceMin} />
              <input type="hidden" name="priceMax" value={filters.priceMax} />
              <input type="hidden" name="mileageMax" value={filters.mileageMax} />
              <label htmlFor="sort-by" className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                Sort by
              </label>
              <Select id="sort-by" name="sortBy" defaultValue={filters.sortBy} className="h-10">
                <option value="publishedAt">Newest</option>
                <option value="askPriceUsd">Price</option>
                <option value="year">Year</option>
                <option value="inspectionScore">Inspection score</option>
              </Select>
              <button className={buttonVariants({ variant: "outline", size: "sm" })}>Apply</button>
            </form>
          </div>

          {chips.length > 0 ? <FilterChips chips={chips} clearAllHref="/vehicles" /> : null}

          {isServerApiFailure(catalogueResult) ? (
            <ErrorBanner
              message={catalogueResult.error.message}
              correlationId={catalogueResult.error.correlationId}
            />
          ) : catalogueResult.data.data.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {catalogueResult.data.data.map((listing) => (
                  <VehicleCard
                    key={listing.id}
                    {...listing}
                    signedIn={signedIn}
                    savedInitial={savedIds.has(listing.id)}
                    returnHref={returnHref}
                  />
                ))}
              </div>
              {catalogueResult.data.meta.hasMore && catalogueResult.data.meta.nextCursor ? (
                <div className="flex justify-center pt-2">
                  <Link
                    href={vehiclesHref({ cursor: catalogueResult.data.meta.nextCursor }, filters)}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Load more vehicles
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={Search}
              headline={chips.length > 0 ? "No vehicles match these filters" : "No published vehicles yet"}
              body={
                chips.length > 0
                  ? "Try removing one or more filters to widen the search."
                  : "The catalogue endpoint is live, but no vehicles are published yet."
              }
              cta={chips.length > 0 ? { label: "Clear filters", href: "/vehicles" } : undefined}
            />
          )}

        </div>
      </div>
    </main>
  );
}
