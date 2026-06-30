import type { SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Heart } from "lucide-react";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";

export default async function SavedPage() {
  const savedResult = await getSessionJson<OffsetPaginatedResponse<SavedVehicleDto>>(
    withQuery(ROUTES.me.savedVehicles, { page: 1, limit: 24 }),
  );

  if (isServerApiFailure(savedResult)) {
    if (savedResult.error.statusCode === 401) {
      return (
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <EmptyState
            icon={Heart}
            headline="Sign in to see saved vehicles"
            body="Saved vehicles are stored against your buyer account and can be opened from any device after login."
            cta={{ label: "Sign in", href: "/auth/login?next=%2Fsaved" }}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <ErrorBanner
          message={savedResult.error.message}
          correlationId={savedResult.error.correlationId}
        />
      </main>
    );
  }

  const savedVehicles = savedResult.data.data;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
          Buyer shortlist
        </p>
        <h1 className="display mt-4 text-4xl text-[var(--ink-900)] sm:text-5xl">
          Saved vehicles
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-500)]">
          Your shortlist is backed by the staging API. Save vehicles from browse
          or from the buyer workspace to keep them here.
        </p>
      </section>

      <section className="mt-6">
        {savedVehicles.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedVehicles.map(({ id, listing }) => (
              <VehicleCard key={id} {...listing} signedIn />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            headline="No saved vehicles yet"
            body="Save vehicles from the marketplace to build a shortlist before requesting a quote or viewing."
            cta={{ label: "Browse vehicles", href: "/vehicles" }}
          />
        )}
      </section>
    </main>
  );
}
