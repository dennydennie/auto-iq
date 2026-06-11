import Link from "next/link";
import type { PublicListingDto } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  AlertTriangle,
  ArrowLeft,
  Fuel,
  Gauge,
  GitBranch,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VehicleInterestPanel } from "@/components/marketplace/vehicle-interest-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { getOptionalSessionJson, getPublicJson, getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum, mapBodyType, relativeListingAge } from "@/lib/vehicle-ui";

function specItems(listing: PublicListingDto) {
  return [
    { icon: Gauge, label: "Mileage", value: formatKm(listing.mileageKm) },
    { icon: GitBranch, label: "Transmission", value: labelizeEnum(listing.transmission) },
    { icon: Fuel, label: "Fuel", value: labelizeEnum(listing.fuelType) },
    { icon: Wrench, label: "Engine", value: listing.engineCapacity || "Unspecified" },
  ];
}

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

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingResult = await getPublicJson<PublicListingDto>(ROUTES.catalogue.detail(id));
  const meResult = await getOptionalSessionJson<MeResponse>(ROUTES.me.profile);
  const currentViewer = viewerState(meResult);
  const referenceDataResult = currentViewer === "buyer"
    ? await getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all)
    : null;

  if (isServerApiFailure(listingResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {listingResult.error.statusCode === 404 ? (
          <EmptyState
            icon={ShieldCheck}
            headline="Vehicle not found"
            body="This listing slug no longer resolves to a published vehicle in staging."
            cta={{ label: "Back to catalogue", href: "/vehicles" }}
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
  const coverImage = listing.coverImageUrl ?? listing.images[0]?.url ?? null;
  const summary = listing.inspectionSummary;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Link href="/vehicles" className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/92 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,205,83,0.18),transparent_36%),linear-gradient(180deg,#18233e_0%,#0f1830_100%)] px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4 text-white">
              <div className="flex flex-wrap gap-2">
                {listing.bisellVerified ? <StatusBadge status="verified" /> : null}
                <Badge variant="amber">{labelizeEnum(listing.bodyType)}</Badge>
              </div>
              <div>
                <h1 className="display text-4xl text-white sm:text-5xl">
                  {listing.year} {listing.make} {listing.model}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FFC72C]" />
                    {listing.city}
                  </span>
                  <span>{relativeListingAge(listing.daysListed)}</span>
                  <span>{listing.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <p className="display text-4xl text-white">{formatPrice(listing.askPriceUsd, "USD")}</p>
                <p className="pb-1 text-sm text-white/65">
                  {listing.negotiable ? "Negotiable" : "Fixed seller price"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/8 shadow-[0_20px_60px_-40px_rgba(5,10,26,0.85)]">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={`${listing.year} ${listing.make} ${listing.model}`}
                  className="h-[18rem] w-full object-cover"
                />
              ) : (
                <div className="flex h-[18rem] items-center justify-center">
                  <CarSilhouette type={mapBodyType(listing.bodyType)} width={320} shadow={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {specItems(listing).map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--amber-dark)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
              <h2 className="display text-2xl text-[var(--ink-900)]">Seller disclosure</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
                {listing.sellerDisclosure || "The seller has not added a public disclosure yet."}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-[#FDE6CD] p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A3412]" />
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7C2D12]">
                    Avoid side deals
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#9A3412]">
                    Viewings and negotiations must stay inside BiSell. The live buyer actions below now save through the API so the admin team can track and protect the interaction.
                  </p>
                </div>
              </div>
            </div>

            <VehicleInterestPanel
              listingId={listing.id}
              viewerState={currentViewer}
              viewingLocations={locations}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-5 text-white">
              {summary ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={summary.overallScore} size={76} light />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">BiSell health check</p>
                      <h2 className="display mt-2 text-2xl text-white">{summary.overallScore}/100</h2>
                      <p className="mt-1 text-sm text-white/65">
                        Inspected {formatDate(summary.inspectionDate)} by {summary.inspectorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={summary.roadworthy ? "success" : "warning"}>
                      {summary.roadworthy ? "Roadworthy" : "Needs review"}
                    </Badge>
                    {summary.categories.slice(0, 3).map((category) => (
                      <Badge key={category.category} variant="outline" className="border-white/20 text-white">
                        {labelizeEnum(category.category)} {category.score}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-white/72">
                    {summary.inspectorNote || "Buyer-safe inspection notes are available for this vehicle."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">BiSell health check</p>
                  <h2 className="display text-2xl text-white">Summary pending</h2>
                  <p className="text-sm leading-6 text-white/70">
                    This listing is live, but the buyer-safe inspection summary has not been approved for publication yet.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
              <h2 className="display text-2xl text-[var(--ink-900)]">Vehicle profile</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-[var(--ink-100)] pb-3">
                  <dt className="text-[var(--ink-400)]">Drive type</dt>
                  <dd className="font-semibold text-[var(--ink-900)]">{labelizeEnum(listing.driveType)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--ink-100)] pb-3">
                  <dt className="text-[var(--ink-400)]">Colour</dt>
                  <dd className="font-semibold text-[var(--ink-900)]">{listing.colour}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--ink-100)] pb-3">
                  <dt className="text-[var(--ink-400)]">Published</dt>
                  <dd className="font-semibold text-[var(--ink-900)]">{formatDate(listing.publishedAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-400)]">Photos</dt>
                  <dd className="font-semibold text-[var(--ink-900)]">{listing.images.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
