import type { Metadata } from "next";
import Link from "next/link";
import type { PublicListingDto, SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { AlertTriangle, ArrowLeft, Lock, MapPin, ShieldCheck } from "lucide-react";
import { VehiclePhotoBrowser } from "@/components/listing/vehicle-photo-browser";
import { VehicleDetailSpecs } from "@/components/marketplace/vehicle-detail-specs";
import { SaveVehicleButton } from "@/components/marketplace/save-vehicle-button";
import { VehicleInterestPanel } from "@/components/marketplace/vehicle-interest-panel";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { getOptionalSessionJson, getPublicJson, getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { labelizeEnum, mapBodyType, relativeListingAge } from "@/lib/vehicle-ui";

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function viewerState(
  result:
    | { ok: true; data: MeResponse }
    | { ok: false; error: { message: string } }
    | null,
) {
  if (!result || !result.ok) {
    return "anonymous" as const;
  }

  return result.data.roles.includes("BUYER") ? "buyer" as const : "other" as const;
}

function readReturnHref(value: string | string[] | undefined, fallback: string) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return fallback;
  return candidate.startsWith("/vehicles") ? candidate : fallback;
}

function pageTitle(listing: PublicListingDto) {
  return `${listing.year} ${listing.make} ${listing.model}`;
}

function summarySpecs(listing: PublicListingDto) {
  return [
    { label: "Mileage", value: formatKm(listing.mileageKm) },
    { label: "Drive Type", value: labelizeEnum(listing.driveType) },
    { label: "Transmission", value: labelizeEnum(listing.transmission) },
    { label: "Fuel", value: labelizeEnum(listing.fuelType) },
    { label: "Engine", value: listing.engineCapacity || "Not provided" },
    { label: "Body", value: labelizeEnum(listing.bodyType) },
  ];
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicJson<PublicListingDto>(ROUTES.catalogue.detail(id));

  if (isServerApiFailure(result)) {
    return {
      title: "Vehicle not found",
      alternates: { canonical: `/vehicles/${id}` },
    };
  }

  const listing = result.data;
  const title = `${pageTitle(listing)} for Sale`;
  const description = `${formatPrice(listing.askPriceUsd, "USD")} ${listing.year} ${listing.make} ${listing.model} in ${listing.city}. View mileage, fuel, transmission, photos, and inspection details.`;

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${listing.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/vehicles/${listing.slug}`,
      images: listing.coverImageUrl ? [{ url: listing.coverImageUrl }] : undefined,
    },
  };
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: SearchParams;
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
      ? getOptionalSessionJson<OffsetPaginatedResponse<SavedVehicleDto>>(
          withQuery(ROUTES.me.savedVehicles, { page: 1, limit: 100 }),
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
            body="This listing slug no longer resolves to a published vehicle in staging."
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
  const signedIn = currentViewer !== "anonymous";
  const title = pageTitle(listing);
  const isSaved =
    savedResult !== null && savedResult.ok
      ? savedResult.data.data.some((entry) => entry.listing.id === listing.id)
      : false;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Catalogue", href: backHref },
          { label: title },
        ]}
      />
      <Link href={backHref} className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start">
        <div className="space-y-8">
          <VehiclePhotoBrowser
            images={listing.images}
            title={title}
            frameClassName="h-[24rem] bg-[var(--ink-900)] sm:h-[34rem]"
            fallback={
              <div className="flex h-[24rem] items-center justify-center rounded-[1.7rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] sm:h-[34rem]">
                <CarSilhouette type={mapBodyType(listing.bodyType)} width={420} shadow={false} />
              </div>
            }
          />

          <VehicleDetailSpecs listing={listing} />

          <section className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
            <h2 className="display text-2xl text-[var(--ink-900)]">Seller disclosure</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
              {listing.sellerDisclosure || "The seller has not added a public disclosure yet."}
            </p>
          </section>

          <section className="rounded-[1.5rem] bg-[#FDE6CD] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A3412]" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7C2D12]">
                  Avoid side deals
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#9A3412]">
                  Keep viewings, quotes, and seller contact inside BiSell so the interaction remains traceable.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-[0_28px_90px_-52px_rgba(22,31,58,0.45)]">
            <div className="flex flex-wrap gap-2">
              {listing.bisellVerified ? <StatusBadge status="verified" /> : null}
              <Badge variant="amber">{labelizeEnum(listing.bodyType)}</Badge>
            </div>
            <h1 className="display mt-4 text-3xl leading-tight text-[var(--ink-900)]">
              {title}
            </h1>
            <p className="display mt-4 text-4xl text-[var(--amber-dark)]">
              {formatPrice(listing.askPriceUsd, "USD")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--ink-500)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-50)] px-3 py-1 font-semibold text-[var(--ink-900)]">
                <MapPin className="h-4 w-4 text-[var(--amber-dark)]" />
                {listing.city}
              </span>
              <span className="rounded-full bg-[var(--ink-50)] px-3 py-1">
                {relativeListingAge(listing.daysListed)}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[var(--ink-100)] py-5">
              {summarySpecs(listing).map((spec) => (
                <div key={spec.label} className="rounded-2xl bg-[var(--ink-50)]/80 p-3 text-center">
                  <p className="text-xs text-[var(--ink-400)]">{spec.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              <Link href="#contact" className={buttonVariants({ variant: "amber" })}>
                Request viewing or quote
              </Link>
              <SaveVehicleButton
                listingId={listing.id}
                listingSlugOrId={listing.slug}
                signedIn={signedIn}
                initialSaved={isSaved}
                variant="outline"
              />
            </div>
          </section>

          {currentViewer === "anonymous" ? (
            <section className="rounded-[1.5rem] border border-[var(--amber-dark)]/30 bg-[var(--amber-soft)]/55 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--amber-dark)]">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="space-y-3">
                  <h2 className="display text-xl text-[var(--ink-900)]">Contact unlocks on sign-in</h2>
                  <p className="text-sm leading-6 text-[var(--ink-700)]">
                    Sign in to request viewings, send quotes, and keep the buyer workflow tied to your account.
                  </p>
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(`/vehicles/${id}`)}`}
                    className={buttonVariants({ variant: "amber", size: "sm" })}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.5rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-5 text-white">
            {summary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <ScoreGauge
                    score={summary.overallScore}
                    size={76}
                    light
                    ariaLabel={`${title} inspection score ${summary.overallScore} out of 100`}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-white/45">BiSell health check</p>
                    <h2 className="display mt-2 text-2xl text-white">{summary.overallScore}/100</h2>
                    <p className="mt-1 text-sm text-white/65">
                      Inspected {formatDate(summary.inspectionDate)}
                    </p>
                  </div>
                </div>
                <Badge variant={summary.roadworthy ? "success" : "warning"}>
                  {summary.roadworthy ? "Roadworthy" : "Needs review"}
                </Badge>
                <p className="text-sm leading-6 text-white/72">
                  {summary.inspectorNote || "Buyer-safe inspection notes are available for this vehicle."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">BiSell health check</p>
                <h2 className="display text-2xl text-white">Summary pending</h2>
                <p className="text-sm leading-6 text-white/70">
                  The buyer-safe inspection summary has not been approved for publication yet.
                </p>
              </div>
            )}
          </section>

          <div id="contact" className="scroll-mt-24">
            <VehicleInterestPanel
              listingId={listing.id}
              viewerState={currentViewer}
              viewingLocations={locations}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
