import type { SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Heart } from "lucide-react";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function SavedPage() {
  const result = await getSessionJson<SavedVehicleDto[]>(ROUTES.me.savedVehicles);

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={Heart}
            headline="Sign in to see your saved vehicles"
            body="Save vehicles you're interested in and come back to them from any device."
            cta={{ label: "Go to login", href: "/auth/login?next=/saved" }}
          />
        ) : (
          <ErrorBanner
            message={result.error.message}
            correlationId={result.error.correlationId}
          />
        )}
      </main>
    );
  }

  const saved = result.data;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Buyer workspace"
        title="Saved vehicles"
        description={
          saved.length === 0
            ? "Vehicles you save will appear here."
            : `${saved.length} vehicle${saved.length === 1 ? "" : "s"} saved for later.`
        }
      />

      {saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          headline="No saved vehicles yet"
          body="Tap the heart on any listing to save it. Come back here to compare or continue where you left off."
          cta={{ label: "Browse catalogue", href: "/vehicles" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((entry) => (
            <VehicleCard
              key={entry.id}
              {...entry.listing}
              signedIn
              savedInitial
            />
          ))}
        </div>
      )}
    </main>
  );
}
