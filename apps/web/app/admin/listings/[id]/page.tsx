import Image from "next/image";
import Link from "next/link";
import type { AdminListingDto } from "@auto-iq/contracts/admin";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ImageIcon,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { AdminListingActions } from "@/components/admin/admin-listing-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum, mapBodyType, mapListingStatus } from "@/lib/vehicle-ui";

function checklist(listing: AdminListingDto) {
  return [
    { label: "Seller disclosure submitted", complete: Boolean(listing.sellerDisclosure) },
    { label: "At least one photo uploaded", complete: listing.images.length > 0 },
    { label: "Ownership verification approved", complete: listing.ownershipVerification?.status === "APPROVED" },
    { label: "Inspection task assigned", complete: Boolean(listing.inspectionTask) },
    { label: "Buyer summary approved", complete: Boolean(listing.inspectionReport?.buyerSummaryApproved) },
  ];
}

export default async function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSessionJson<AdminListingDto>(ROUTES.admin.listing(id));

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 404 ? (
          <EmptyState
            icon={AlertTriangle}
            headline="Listing not found"
            body="This listing could not be loaded from the admin detail endpoint."
            cta={{ label: "Back to moderation queue", href: "/admin/listings" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const listing = result.data;
  const coverImage = listing.images[0]?.url ?? null;
  const items = checklist(listing);
  const completedItems = items.filter((item) => item.complete).length;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Link href="/admin/listings" className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to moderation queue
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="relative bg-[radial-gradient(circle_at_top,rgba(255,205,83,0.18),transparent_36%),linear-gradient(180deg,#18233e_0%,#0f1830_100%)] px-6 py-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div className="space-y-4 text-white">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={mapListingStatus(listing.status)} />
                    <Badge variant="amber">{labelizeEnum(listing.specs.bodyType)}</Badge>
                  </div>
                  <div>
                    <h1 className="display text-4xl text-white">
                      {listing.specs.year} {listing.specs.make} {listing.specs.model}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                      <span>{listing.id}</span>
                      <span>{listing.slug}</span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#FFC72C]" />
                        {listing.images.length} photos
                      </span>
                    </div>
                  </div>
                  <p className="display text-4xl text-white">
                    {formatPrice(listing.pricing.askPriceUsd, "USD")}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/8">
                  {coverImage ? (
                    <div className="relative h-[18rem] w-full">
                      <Image
                        src={coverImage}
                        alt={`${listing.specs.year} ${listing.specs.make} ${listing.specs.model}`}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[18rem] items-center justify-center">
                      <CarSilhouette type={mapBodyType(listing.specs.bodyType)} width={320} shadow={false} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Mileage</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{formatKm(listing.specs.mileageKm)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Transmission</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{labelizeEnum(listing.specs.transmission)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Fuel</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{labelizeEnum(listing.specs.fuelType)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Engine</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{listing.specs.engineCapacity || "Unspecified"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller disclosure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-[var(--ink-500)]">
                {listing.sellerDisclosure || "No seller disclosure has been saved yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ownership documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {listing.documents.length > 0 ? listing.documents.map((document) => (
                <a
                  key={document.id}
                  href={document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[1.1rem] border border-[var(--ink-100)] px-4 py-3 text-sm transition hover:bg-[var(--ink-50)]"
                >
                  <span className="inline-flex items-center gap-3 text-[var(--ink-900)]">
                    <FileText className="h-4 w-4 text-[var(--amber-dark)]" />
                    {labelizeEnum(document.documentType)}
                  </span>
                  <span className="text-[var(--ink-500)]">{document.reviewStatus}</span>
                </a>
              )) : (
                <div className="rounded-[1.2rem] border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/60 p-4 text-sm text-[var(--ink-500)]">
                  No ownership documents are attached yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Moderation actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminListingActions listingId={listing.id} status={listing.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[1.1rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/60 px-4 py-3 text-sm text-[var(--ink-500)]">
                {completedItems} of {items.length} checklist items satisfied.
              </div>
              {items.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-[1.1rem] border border-[var(--ink-100)] px-4 py-3">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 ${item.complete ? "text-emerald-600" : "text-[var(--ink-300)]"}`} />
                  <span className={`text-sm ${item.complete ? "text-[var(--ink-900)]" : "text-[var(--ink-500)]"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inspection state</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.inspectionReport ? (
                <div className="rounded-[1.2rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-4 text-white">
                  <div className="flex items-center gap-4">
                    <ScoreGauge
                      score={listing.inspectionReport.overallScore}
                      size={72}
                      light
                      ariaLabel={`${listing.specs.year} ${listing.specs.make} ${listing.specs.model} inspection score ${listing.inspectionReport.overallScore} out of 100`}
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">Buyer summary</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {listing.inspectionReport.overallScore}/100
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        Approved {listing.inspectionReport.buyerSummaryApproved ? "yes" : "no"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/60 p-4 text-sm text-[var(--ink-500)]">
                  No inspection report is attached to this listing yet.
                </div>
              )}
              <div className="space-y-3 text-sm text-[var(--ink-500)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--amber-dark)]" />
                    Ownership verification
                  </span>
                  <span className="font-semibold text-[var(--ink-900)]">
                    {listing.ownershipVerification?.status || "NOT_STARTED"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[var(--amber-dark)]" />
                    Inspection task
                  </span>
                  <span className="font-semibold text-[var(--ink-900)]">
                    {listing.inspectionTask?.status || "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <span className="font-semibold text-[var(--ink-900)]">
                    {listing.submittedAt ? formatDate(listing.submittedAt) : "Not submitted"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
