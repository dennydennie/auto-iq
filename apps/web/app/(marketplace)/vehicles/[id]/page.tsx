import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type {
  PublicListingDto,
  SavedVehicleDto,
} from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SaveVehicleButton } from "@/components/marketplace/save-vehicle-button";
import { SimilarVehicles } from "@/components/marketplace/similar-vehicles";
import { VehicleDetailSpecs } from "@/components/marketplace/vehicle-detail-specs";
import { VehicleInterestPanel } from "@/components/marketplace/vehicle-interest-panel";
import { VehiclePhotoBrowser } from "@/components/marketplace/vehicle-photo-browser";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { extractSavedVehicles } from "@/lib/saved-vehicles";
import { getOptionalSessionJson, getPublicJson, getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum, mapBodyType, relativeListingAge } from "@/lib/vehicle-ui";

// ─── Metadata (page title in the browser tab) ──────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicJson<PublicListingDto>(ROUTES.catalogue.detail(id));
  if (isServerApiFailure(result)) {
    return { title: "Vehicle | BiSell AutoIQ" };
  }
  const l = result.data;
  return {
    title: `${l.year} ${l.make} ${l.model} for sale | BiSell AutoIQ`,
    description:
      l.sellerDisclosure ??
      `${formatKm(l.mileageKm)}, ${labelizeEnum(l.transmission)}, ${labelizeEnum(l.fuelType)} in ${l.city}.`,
  };
}

function viewerState(
  result:
    | { ok: true; data: MeResponse }
    | { ok: false; error: { message: string } }
    | null,
) {
  if (!result || !result.ok) return "anonymous" as const;
  return result.data.roles.includes("BUYER") ? "buyer" as const : "other" as const;
}

function readReturnHref(value: string | string[] | undefined, fallback: string) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return fallback;
  return candidate.startsWith("/vehicles") ? candidate : fallback;
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { return: returnParam } = await searchParams;
  const backHref = readReturnHref(returnParam, "/vehicles");
  const listingResult = await getPublicJson<PublicListingDto>(ROUTES.catalogue.detail(id));
  const meResult = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const currentViewer = viewerState(meResult);
  const [referenceDataResult, savedResult] = await Promise.all([
    currentViewer === "buyer"
      ? getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all)
      : Promise.resolve(null),
    currentViewer === "buyer"
      ? getOptionalSessionJson<SavedVehicleDto[] | OffsetPaginatedResponse<SavedVehicleDto>>(
          ROUTES.me.savedVehicles,
        )
      : Promise.resolve(null),
  ]);

  if (isServerApiFailure(listingResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {listingResult.error.statusCode === 404 ? (
          <EmptyState
            icon={ShieldCheck}
            headline="Vehicle not found"
            body="This listing is no longer published, or the link is stale."
            cta={{ label: "Back to catalogue", href: backHref }}
          />
        ) : (
          <ErrorBanner
            message={listingResult.error.message}
            correlationId={listingResult.error.correlationId}
          />
        )}
      </main>
    );
  }

  const listing = listingResult.data;
  const locations = referenceDataResult && referenceDataResult.ok
    ? referenceDataResult.data.viewingLocations.filter((location) => location.active)
    : [];
  const summary = listing.inspectionSummary;
  const savedVehicles =
    savedResult !== null && savedResult.ok ? extractSavedVehicles(savedResult.data) : [];
  const isSaved = savedVehicles.some((entry) => entry.listing.id === listing.id);
  const signedIn = currentViewer !== "anonymous";
  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Catalogue", href: backHref },
          { label: title },
        ]}
      />
      <Link href={backHref} className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>

      {/* ─── Hero: gallery on the left, price + trust column on the right ─── */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <VehiclePhotoBrowser
          images={listing.images}
          bodyTone={mapBodyType(listing.bodyType)}
          alt={title}
        />

        <aside className="space-y-5">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {listing.bisellVerified ? <StatusBadge status="verified" /> : null}
              <Badge variant="outline">{labelizeEnum(listing.bodyType)}</Badge>
              {summary?.roadworthy ? (
                <Badge variant="success">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Roadworthy
                </Badge>
              ) : null}
            </div>

            <h1 className="display text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ink-500)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[var(--amber-dark)]" />
                {listing.city}
              </span>
              <span>{relativeListingAge(listing.daysListed)}</span>
              <span>{listing.viewCount} views</span>
            </div>
          </header>

          <div className="rounded-2xl border border-[var(--ink-100)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-400)]">
              {listing.negotiable ? "Asking price · negotiable" : "Asking price · fixed"}
            </p>
            <p className="display mt-1 text-4xl text-[var(--ink-900)]">
              {formatPrice(listing.askPriceUsd, "USD")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="#contact"
                className={buttonVariants({ variant: "amber", size: "sm", className: "flex-1 justify-center" })}
              >
                {signedIn ? "Request viewing" : "Sign in to contact"}
              </Link>
              <SaveVehicleButton
                listingId={listing.id}
                listingSlugOrId={listing.slug}
                signedIn={signedIn}
                initialSaved={isSaved}
                variant="outline"
                size="sm"
              />
            </div>
          </div>

          {/* Inspection score gauge — prominent trust signal */}
          <div className="rounded-2xl bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-5 text-white">
            {summary ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <ScoreGauge
                    score={summary.overallScore}
                    size={72}
                    light
                    ariaLabel={`${title} inspection score ${summary.overallScore} out of 100`}
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      BiSell health check
                    </p>
                    <p className="display text-2xl">{summary.overallScore}/100</p>
                    <p className="text-xs text-white/60">
                      Inspected {formatDate(summary.inspectionDate)}
                    </p>
                  </div>
                </div>
                {summary.inspectorNote ? (
                  <p className="text-xs leading-5 text-white/72">{summary.inspectorNote}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  BiSell health check
                </p>
                <p className="display text-2xl">Summary pending</p>
                <p className="text-xs leading-5 text-white/70">
                  Inspection scheduled — buyer-safe summary hasn&apos;t been approved for publication yet.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <VehicleDetailSpecs listing={listing} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--ink-100)] bg-white p-5">
            <h2 className="display text-xl text-[var(--ink-900)]">Seller disclosure</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
              {listing.sellerDisclosure || "The seller has not added a public disclosure yet."}
            </p>
          </section>

          {/* Anonymous contact-gate banner — merged with the sidebar gate. This
              is the ONE explanation of the contact protection policy. */}
          {currentViewer === "anonymous" ? (
            <section className="rounded-2xl border border-[var(--amber-dark)]/25 bg-[var(--amber-soft)]/55 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--amber-dark)]">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--amber-dark)]">
                    Contact protected
                  </p>
                  <h2 className="display text-xl text-[var(--ink-900)]">
                    Seller contact unlocks on sign-in
                  </h2>
                  <p className="text-sm leading-6 text-[var(--ink-700)]">
                    Contact details and viewing requests are only visible to signed-in
                    buyers. Browsing stays open to everyone.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/auth/login?next=${encodeURIComponent(`/vehicles/${id}`)}`}
                      className={buttonVariants({ variant: "amber", size: "sm" })}
                    >
                      Sign in to contact seller
                    </Link>
                    <Link
                      href={`/auth/signup?role=buyer&next=${encodeURIComponent(`/vehicles/${id}`)}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Create buyer account
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-[#FDE6CD] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A3412]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7C2D12]">
                  Avoid side deals
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#9A3412]">
                  Viewings and negotiations must stay inside BiSell. This protects both
                  buyer and seller — the admin team can only step in when the interaction
                  is recorded on-platform.
                </p>
              </div>
            </div>
          </section>

          <section id="contact" className="scroll-mt-24">
            <h2 className="sr-only">Request viewing or quote</h2>
            <VehicleInterestPanel
              listingId={listing.id}
              viewerState={currentViewer}
              viewingLocations={locations}
            />
          </section>
        </div>

        <aside className="rounded-2xl border border-[var(--ink-100)] bg-white p-5 lg:sticky lg:top-24 lg:self-start">
          <h2 className="display text-xl text-[var(--ink-900)]">Inspection summary</h2>
          {summary ? (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-400)]">
                Inspection categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.categories.map((category) => (
                  <Badge key={category.category} variant="outline">
                    {labelizeEnum(category.category)} · {category.score}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
              Inspection category details will appear once admin publishes the buyer-safe summary.
            </p>
          )}
        </aside>
      </div>

      <Suspense fallback={null}>
        <SimilarVehicles listing={listing} signedIn={signedIn} />
      </Suspense>
    </main>
  );
}
