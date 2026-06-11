"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Calendar, Eye, MessageSquare, Plus, Sparkles } from "lucide-react";
import type { BodyType, ListingStatus } from "@auto-iq/contracts/enums";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { SellerListingSummaryDto } from "@auto-iq/contracts/listings";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSpinner } from "@/components/shared/page-spinner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerListingCard } from "@/components/listing/seller-listing-card";
import { getJson, isApiFailure } from "@/lib/web-api";

type SellerListingsResponse = {
  data: SellerListingSummaryDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "Seller";
}

function mapStatus(status: ListingStatus): Parameters<typeof SellerListingCard>[0]["status"] {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "CHANGES_REQUESTED":
      return "changes";
    case "SUBMITTED":
    case "INSPECTION_PENDING":
    case "OWNERSHIP_VERIFICATION_PENDING":
    case "APPROVED":
      return "inspection";
    case "RESERVED":
      return "reserved";
    case "SOLD":
      return "sold";
    case "REJECTED":
      return "rejected";
    case "DELISTED":
      return "delisted";
    case "DRAFT":
    default:
      return "draft";
  }
}

function mapBodyType(bodyType: BodyType): Parameters<typeof SellerListingCard>[0]["bodyType"] {
  switch (bodyType) {
    case "BAKKIE":
      return "bakkie";
    case "SUV":
      return "suv";
    case "HATCH":
      return "hatch";
    default:
      return "sedan";
  }
}

function sumBy(listings: SellerListingSummaryDto[], key: "viewCount" | "viewingCount" | "quoteCount") {
  return listings.reduce((total, listing) => total + listing[key], 0);
}

export function SellerDashboard() {
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [listings, setListings] = useState<SellerListingSummaryDto[]>([]);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const profileResult = await getJson<MeResponse>("/api/me");
      if (isApiFailure(profileResult)) {
        if (profileResult.error.statusCode === 401) {
          setUnauthorized(true);
          return;
        }

        setError(profileResult.error);
        return;
      }

      const listingsResult = await getJson<SellerListingsResponse>("/api/seller/listings");
      if (isApiFailure(listingsResult)) {
        if (listingsResult.error.statusCode === 401) {
          setUnauthorized(true);
          return;
        }

        setError(listingsResult.error);
        return;
      }

      setProfile(profileResult.data);
      setListings(listingsResult.data.data);
    });
  }, []);

  if (isPending && !profile && !unauthorized && !error) {
    return <PageSpinner label="Loading seller workspace" />;
  }

  if (unauthorized) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          icon={Plus}
          headline="Sign in as a seller to load live data"
          body="This workspace now reads from the real API. Use a seller account first, then come back here to see your saved listings."
          cta={{ label: "Go to login", href: "/auth/login" }}
        />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      </main>
    );
  }

  if (!profile) {
    return <PageSpinner label="Loading seller workspace" />;
  }

  const metrics = [
    { label: "Views", value: sumBy(listings, "viewCount"), icon: Eye },
    { label: "Viewings", value: sumBy(listings, "viewingCount"), icon: Calendar },
    { label: "Quotes", value: sumBy(listings, "quoteCount"), icon: MessageSquare },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.34fr]">
        <Card className="overflow-hidden bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] text-white">
          <CardHeader>
            <Badge variant="amber" className="w-fit bg-white/10 text-[#FFC72C]">
              Seller workspace
            </Badge>
            <CardTitle className="mt-3 text-4xl text-white">
              Hey, {firstName(profile.fullName)}. Your listings are now live.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              This dashboard is reading from the staging API and reflects records saved in
              the real database instead of placeholder inventory.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/48">
                    <Icon className="h-4 w-4 text-[#FFC72C]" />
                    {label}
                  </div>
                  <div className="display mt-4 text-3xl text-white">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <Badge variant="outline">Next action</Badge>
              <h2 className="display mt-4 text-3xl text-[var(--ink-900)]">
                Add a new vehicle
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
                The create flow now writes a real draft listing through the live API and
                brings it straight back into this workspace.
              </p>
            </div>
            <Link
              href="/seller/listings/new"
              className={buttonVariants({ variant: "amber", className: "mt-6 justify-center" })}
            >
              <Plus className="h-4 w-4" />
              Start listing wizard
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-[var(--amber-dark)]" />
          <div>
            <h2 className="display text-2xl text-[var(--ink-900)]">
              The seller view is reading from the database now
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
              Listing summaries, counts, and updated timestamps are no longer static copy.
              They are coming back from the staging API behind the app proxy.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-3xl text-[var(--ink-900)]">Your listings</h2>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Current records saved for your seller account.
            </p>
          </div>
          <Link href="/seller/listings/new" className={buttonVariants({ variant: "outline" })}>
            Create new listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Plus}
            headline="No live listings yet"
            body="Create your first draft listing and it will appear here as soon as the API saves it."
            cta={{ label: "Create a listing", href: "/seller/listings/new" }}
          />
        ) : (
          listings.map((listing) => (
            <SellerListingCard
              key={listing.id}
              href={`/seller/listings/${listing.id}`}
              id={listing.id}
              year={listing.year}
              make={listing.make}
              model={listing.model}
              price={listing.askPriceUsd}
              status={mapStatus(listing.status)}
              bodyType={mapBodyType(listing.bodyType)}
              views={listing.viewCount}
              viewings={listing.viewingCount}
              quotes={listing.quoteCount}
              note={listing.changesNote}
            />
          ))
        )}
      </div>
    </main>
  );
}
