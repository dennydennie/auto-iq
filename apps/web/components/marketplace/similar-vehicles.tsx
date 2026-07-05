import Link from "next/link";
import type { CatalogueResponse, PublicListingDto } from "@auto-iq/contracts/catalogue";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowRight } from "lucide-react";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublicJson, isServerApiFailure, withQuery } from "@/lib/server-api";

/**
 * Server component that fetches a small slice of similar vehicles and renders
 * them as a horizontal rail below the detail page. Similarity is fuzzy — same
 * body type + a nearby price band — because the API doesn't yet expose a
 * dedicated "similar" endpoint.
 */
export async function SimilarVehicles({
  listing,
  signedIn,
}: {
  listing: PublicListingDto;
  signedIn: boolean;
}) {
  const priceMin = Math.max(0, Math.round(listing.askPriceUsd * 0.7));
  const priceMax = Math.round(listing.askPriceUsd * 1.3);

  const path = withQuery(ROUTES.catalogue.list, {
    limit: 6,
    bodyType: listing.bodyType,
    priceMin,
    priceMax,
    sortBy: "publishedAt",
    sortDir: "DESC",
  });

  const result = await getPublicJson<CatalogueResponse>(path);
  if (isServerApiFailure(result)) return null;

  // Filter the current listing out and cap to 4 cards.
  const similar = result.data.data.filter((entry) => entry.id !== listing.id).slice(0, 4);
  if (similar.length === 0) return null;

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-400)]">
            You may also like
          </p>
          <h2 className="display mt-1 text-2xl text-[var(--ink-900)]">
            Similar vehicles
          </h2>
        </div>
        <Link href="/vehicles" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Browse all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {similar.map((entry) => (
          <VehicleCard
            key={entry.id}
            {...entry}
            signedIn={signedIn}
          />
        ))}
      </div>
    </section>
  );
}
