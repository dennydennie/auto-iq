import Link from "next/link";
import { BODY_TYPES } from "@auto-iq/contracts/enums";
import type { CatalogueResponse } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { CarFront, Heart, Search, ShieldCheck, SlidersHorizontal, Tags } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getOptionalSessionJson, getPublicJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const POPULAR_CITIES = ["Harare", "Bulawayo", "Mutare", "Gweru"];

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function filterHref(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/vehicles?${query}` : "/vehicles";
}

function nextPageHref(
  nextCursor: string,
  filters: { bodyType: string; city: string; make: string; sortBy: string; verified: string },
) {
  return filterHref({ ...filters, cursor: nextCursor });
}

function firstName(profile: MeResponse | null) {
  return profile?.fullName.split(" ")[0] || "there";
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const bodyType = readValue(params.bodyType);
  const city = readValue(params.city);
  const cursor = readValue(params.cursor);
  const make = readValue(params.make);
  const sortBy = readValue(params.sortBy) || "publishedAt";
  const verified = readValue(params.verified);
  const cataloguePath = withQuery(ROUTES.catalogue.list, {
    limit: 12,
    cursor,
    city,
    make,
    bodyType,
    sortBy,
    sortDir: "DESC",
    bisellVerified: verified === "true" ? true : undefined,
  });
  const [result, meResult] = await Promise.all([
    getPublicJson<CatalogueResponse>(cataloguePath),
    getOptionalSessionJson<MeResponse>(ROUTES.me.profile),
  ]);
  const profile = meResult && meResult.ok ? meResult.data : null;
  const signedIn = profile !== null;
  const canSave = profile?.roles.includes("BUYER") ?? false;
  const resultCount = result.ok ? result.data.data.length : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <Badge variant="outline">Live marketplace</Badge>
            <h1 className="display mt-4 max-w-3xl text-5xl leading-[0.92] text-[var(--ink-900)] sm:text-6xl">
              {signedIn ? `${firstName(profile)}, browse with context.` : "Browse verified vehicle listings."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-500)]">
              Search inspected stock, save vehicles to your shortlist, and open listing
              details to request quotes or viewings through the API-backed workflow.
            </p>

            <form className="mt-8 grid gap-3 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/75 p-4 md:grid-cols-[1.1fr_1fr_1fr_auto]">
              <Input type="text" name="make" defaultValue={make} placeholder="Search make" />
              <Input type="text" name="city" defaultValue={city} placeholder="City" />
              <Select name="bodyType" defaultValue={bodyType}>
                <option value="">All body types</option>
                {BODY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {labelizeEnum(value)}
                  </option>
                ))}
              </Select>
              <button className={buttonVariants({ variant: "amber", className: "min-w-32" })}>
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>
          </div>

          <div className="bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
              Buyer shortcuts
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                href="/buyer"
                className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:bg-white/10"
              >
                <Heart className="h-5 w-5 text-[#FFC72C]" />
                <p className="mt-3 font-semibold text-white">Open buyer desk</p>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  Saved vehicles, quotes, and viewings in one workflow.
                </p>
              </Link>
              <Link
                href={filterHref({ verified: "true" })}
                className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:bg-white/10"
              >
                <ShieldCheck className="h-5 w-5 text-[#FFC72C]" />
                <p className="mt-3 font-semibold text-white">Verified only</p>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  Show listings with approved BiSell inspection summaries.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.74fr]">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-[var(--amber-dark)]" />
              <p className="text-sm font-semibold text-[var(--ink-900)]">Popular searches</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {BODY_TYPES.slice(0, 6).map((value) => (
                <Link
                  key={value}
                  href={filterHref({ bodyType: value })}
                  className={buttonVariants({ variant: bodyType === value ? "default" : "outline", size: "sm" })}
                >
                  {labelizeEnum(value)}
                </Link>
              ))}
              <Link href={filterHref({ verified: "true" })} className={buttonVariants({ variant: "outline", size: "sm" })}>
                BiSell verified
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CarFront className="h-5 w-5 text-[var(--amber-dark)]" />
              <p className="text-sm font-semibold text-[var(--ink-900)]">City rails</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_CITIES.map((value) => (
                <Link
                  key={value}
                  href={filterHref({ city: value })}
                  className={buttonVariants({ variant: city === value ? "default" : "outline", size: "sm" })}
                >
                  {value}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline">
              <Tags className="mr-1 h-3.5 w-3.5" />
              {result.ok ? `${resultCount} shown` : "Catalogue"}
            </Badge>
            <h2 className="display mt-3 text-3xl text-[var(--ink-900)]">Available vehicles</h2>
          </div>
          <form className="flex items-center gap-2">
            <input type="hidden" name="make" value={make} />
            <input type="hidden" name="city" value={city} />
            <input type="hidden" name="bodyType" value={bodyType} />
            <input type="hidden" name="verified" value={verified} />
            <Select name="sortBy" defaultValue={sortBy} className="h-10">
              <option value="publishedAt">Newest</option>
              <option value="askPriceUsd">Price</option>
              <option value="year">Year</option>
              <option value="inspectionScore">Inspection score</option>
            </Select>
            <button className={buttonVariants({ variant: "outline", size: "sm" })}>Apply</button>
          </form>
        </div>

        {isServerApiFailure(result) ? (
          <ErrorBanner
            message={result.error.message}
            correlationId={result.error.correlationId}
          />
        ) : result.data.data.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.data.data.map((listing) => (
                <VehicleCard key={listing.id} {...listing} signedIn={canSave} />
              ))}
            </div>
            {result.data.meta.hasMore && result.data.meta.nextCursor ? (
              <div className="mt-8 flex justify-center">
                <Link
                  href={nextPageHref(result.data.meta.nextCursor, {
                    bodyType,
                    city,
                    make,
                    sortBy,
                    verified,
                  })}
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
            headline="No vehicles match this search"
            body="Try another make, city, or body type. The catalogue is backed by live published listings."
            cta={{ label: "Clear filters", href: "/vehicles" }}
          />
        )}
      </section>
    </main>
  );
}
