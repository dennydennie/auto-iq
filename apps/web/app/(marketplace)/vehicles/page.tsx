import Link from "next/link";
import { BODY_TYPES } from "@auto-iq/contracts/enums";
import type { CatalogueResponse } from "@auto-iq/contracts/catalogue";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPublicJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function nextPageHref(
  nextCursor: string,
  filters: { bodyType: string; city: string; make: string; sortBy: string; verified: string },
) {
  const params = new URLSearchParams();
  params.set("cursor", nextCursor);

  if (filters.bodyType) {
    params.set("bodyType", filters.bodyType);
  }
  if (filters.city) {
    params.set("city", filters.city);
  }
  if (filters.make) {
    params.set("make", filters.make);
  }
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.verified) {
    params.set("verified", filters.verified);
  }

  return `/vehicles?${params.toString()}`;
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
  const result = await getPublicJson<CatalogueResponse>(cataloguePath);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <Badge variant="outline">Live catalogue</Badge>
        <h1 className="display mt-4 text-4xl text-[var(--ink-900)] sm:text-5xl">
          Browse verified vehicle listings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
          Filter by make, city, body type, and verification status to find vehicles
          that match your search.
        </p>

        <form className="mt-8 grid gap-4 rounded-[1.6rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-5 md:grid-cols-5">
          <Input
            type="text"
            name="make"
            defaultValue={make}
            placeholder="Make"
          />
          <Input
            type="text"
            name="city"
            defaultValue={city}
            placeholder="City"
          />
          <Select
            name="bodyType"
            defaultValue={bodyType}
          >
            <option value="">All body types</option>
            {BODY_TYPES.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
          <Select
            name="verified"
            defaultValue={verified}
          >
            <option value="">Any verification</option>
            <option value="true">BiSell verified</option>
          </Select>
          <div className="flex gap-3">
            <Select
              name="sortBy"
              defaultValue={sortBy}
              className="flex-1"
            >
              <option value="publishedAt">Newest</option>
              <option value="askPriceUsd">Price</option>
              <option value="year">Year</option>
              <option value="inspectionScore">Inspection score</option>
            </Select>
            <button className={buttonVariants({ variant: "amber" })}>Apply</button>
          </div>
        </form>
      </div>

      {isServerApiFailure(result) ? (
        <ErrorBanner
          className="mt-8"
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      ) : result.data.data.length > 0 ? (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {result.data.data.map((listing) => (
              <VehicleCard key={listing.id} {...listing} />
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
        <div className="mt-8">
          <EmptyState
            icon={Search}
            headline="No published vehicles yet"
            body="The catalogue endpoint is live, but staging currently has no published listings to return."
          />
        </div>
      )}
    </main>
  );
}
