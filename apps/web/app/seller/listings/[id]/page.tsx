import Image from "next/image";
import Link from "next/link";
import type { SellerListingDto } from "@auto-iq/contracts/listings";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowLeft, Calendar, Eye, FileText, MessageSquare, Pencil, type LucideIcon } from "lucide-react";
import { SubmitListingAction } from "@/components/seller/submit-listing-action";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum, mapBodyType, mapListingStatus } from "@/lib/vehicle-ui";

function nextAction(listing: SellerListingDto) {
  if (listing.status === "DRAFT") return "Complete photos, documents, and submission when ready.";
  if (listing.status === "CHANGES_REQUESTED") return listing.changesNote || "Review the requested changes.";
  if (listing.status === "PUBLISHED") return "Monitor buyer interest and respond to viewing requests.";
  if (listing.status === "REJECTED") return "Review the decision before creating a revised listing.";
  return "Track review progress from this page.";
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
          <Icon className="h-4 w-4 text-[var(--amber-dark)]" />
          {label}
        </div>
        <p className="display mt-3 text-3xl text-[var(--ink-900)]">{value}</p>
        <p className="mt-2 text-xs text-[var(--ink-400)]">Current listing total</p>
      </CardContent>
    </Card>
  );
}

export default async function SellerListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSessionJson<SellerListingDto>(ROUTES.listings.detail(id));

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={FileText}
            headline="Seller sign-in required"
            body="Sign in with the seller account that owns this listing."
            cta={{ label: "Go to login", href: "/auth/login" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const listing = result.data;
  const coverImage = listing.images[0]?.url ?? null;
  const title = `${listing.specs.year} ${listing.specs.make} ${listing.specs.model}`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Seller dashboard", href: "/seller" },
          { label: title },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/seller" className={buttonVariants({ variant: "ghost", className: "px-0" })}>
          <ArrowLeft className="h-4 w-4" />
          Back to seller dashboard
        </Link>
        {listing.status === "DRAFT" || listing.status === "CHANGES_REQUESTED" ? (
          <Link
            href={`/seller/listings/${listing.id}/edit`}
            className={buttonVariants({ variant: "amber" })}
          >
            <Pencil className="h-4 w-4" />
            Edit listing
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="grid gap-6 bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={mapListingStatus(listing.status)} />
                  <Badge variant="amber">{labelizeEnum(listing.specs.bodyType)}</Badge>
                </div>
                <div>
                  <h1 className="display text-4xl text-white">{title}</h1>
                  <p className="mt-3 text-sm text-white/70">{listing.slug}</p>
                </div>
                <p className="display text-4xl text-white">
                  {formatPrice(listing.pricing.askPriceUsd, listing.pricing.currency)}
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/8">
                {coverImage ? (
                  <div className="relative h-[18rem] w-full">
                    <Image
                      src={coverImage}
                      alt={title}
                      fill
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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Mileage" value={formatKm(listing.specs.mileageKm)} />
              <DetailItem label="Colour" value={listing.specs.colour} />
              <DetailItem label="Fuel" value={labelizeEnum(listing.specs.fuelType)} />
              <DetailItem label="Transmission" value={labelizeEnum(listing.specs.transmission)} />
              <DetailItem label="Drive type" value={labelizeEnum(listing.specs.driveType)} />
              <DetailItem label="Condition" value={labelizeEnum(listing.specs.condition)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Next action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[var(--ink-500)]">
              <p>{nextAction(listing)}</p>
              <p>
                Updated {formatDate(listing.updatedAt)}
                {listing.submittedAt ? ` · Submitted ${formatDate(listing.submittedAt)}` : ""}
              </p>
            </CardContent>
          </Card>

          {listing.status === "DRAFT" || listing.status === "CHANGES_REQUESTED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit for review</CardTitle>
              </CardHeader>
              <CardContent>
                <SubmitListingAction
                  listingId={listing.id}
                  defaultDisclosure={listing.sellerDisclosure}
                />
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard icon={Eye} label="Views" value={listing.viewCount} />
            <MetricCard icon={Calendar} label="Viewings" value={listing.viewingCount} />
            <MetricCard icon={MessageSquare} label="Quotes" value={listing.quoteCount} />
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{value}</p>
    </div>
  );
}
