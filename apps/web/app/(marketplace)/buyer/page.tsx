import Link from "next/link";
import type { CatalogueResponse, PublicListingCardDto, SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import type { MeResponse } from "@auto-iq/contracts/identity";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { QuoteDto } from "@auto-iq/contracts/quotes";
import type { VehicleRequestDto } from "@auto-iq/contracts/vehicle-requests";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { ROUTES } from "@auto-iq/contracts/routes";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  Heart,
  Search,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicJson, getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";

type SessionResult<T> = Awaited<ReturnType<typeof getSessionJson<T>>>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type BuyerWorkflow = "saved" | "quotes" | "viewings" | "requests";

const BUYER_ACTIONS = [
  {
    title: "Browse inspected stock",
    body: "Compare verified listings and save vehicles worth a second look.",
    href: "/vehicles",
    label: "Open marketplace",
  },
  {
    title: "Review your shortlist",
    body: "Saved vehicles are persisted through the buyer saved-vehicles API.",
    href: "/saved",
    label: "View saved",
  },
  {
    title: "Request quotes or viewings",
    body: "Open a vehicle detail page to start a backend-backed workflow.",
    href: "/vehicles?verified=true",
    label: "Find verified cars",
  },
];

const WORKFLOW_LABELS: Record<BuyerWorkflow, string> = {
  saved: "Shortlist",
  quotes: "Quotes",
  requests: "Requests",
  viewings: "Viewings",
};

function buyerName(profile: MeResponse) {
  return profile.fullName.split(" ")[0] || "there";
}

function hasBuyerAccess(profile: MeResponse) {
  return profile.roles.includes("BUYER");
}

function countFrom<T>(result: SessionResult<OffsetPaginatedResponse<T>>) {
  return result.ok ? result.data.meta.total : 0;
}

function selectedWorkflow(value: string | string[] | undefined): BuyerWorkflow | null {
  const workflow = Array.isArray(value) ? value[0] : value;
  if (workflow === "saved" || workflow === "quotes" || workflow === "viewings" || workflow === "requests") {
    return workflow;
  }
  return null;
}

function StatusCard({
  active,
  href,
  icon: Icon,
  label,
  value,
  helper,
}: {
  active: boolean;
  href: string;
  icon: typeof Heart;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className="group block">
      <Card className={active ? "border-[var(--amber)] shadow-[0_24px_60px_-38px_rgba(214,155,29,0.55)]" : ""}>
        <CardContent className="flex items-center gap-4 p-5 transition group-hover:bg-[var(--ink-50)]/70">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--amber-soft)] text-[var(--ink-900)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-400)]">
              {label}
            </p>
            <p className="display mt-1 text-3xl text-[var(--ink-900)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--ink-500)]">{helper}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function BuyerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeWorkflow = selectedWorkflow(params.workflow);
  const meResult = await getSessionJson<MeResponse>(ROUTES.me.profile);

  if (isServerApiFailure(meResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShieldCheck}
          headline="Sign in to open your buying desk"
          body="Your buyer workspace shows saved vehicles, quotes, viewings, and recommended listings from live API data."
          cta={{ label: "Sign in", href: "/auth/login?next=%2Fbuyer" }}
        />
      </main>
    );
  }

  if (!hasBuyerAccess(meResult.data)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShieldCheck}
          headline="Buyer access is required"
          body="This workspace is for buyer accounts. Seller and admin workflows remain in their dedicated desks."
          cta={{ label: "Browse vehicles", href: "/vehicles" }}
        />
      </main>
    );
  }

  const buyerCity = meResult.data.buyerProfile?.city || "";
  const cataloguePath = withQuery(ROUTES.catalogue.list, {
    limit: 6,
    city: buyerCity,
    sortBy: "publishedAt",
    sortDir: "DESC",
  });
  const [catalogueResult, savedResult, quotesResult, viewingsResult, requestsResult] = await Promise.all([
    getPublicJson<CatalogueResponse>(cataloguePath),
    getSessionJson<OffsetPaginatedResponse<SavedVehicleDto>>(withQuery(ROUTES.me.savedVehicles, { page: 1, limit: 6 })),
    getSessionJson<OffsetPaginatedResponse<QuoteDto>>(withQuery(ROUTES.quotes.buyerList, { page: 1, limit: 6 })),
    getSessionJson<OffsetPaginatedResponse<ViewingDto>>(withQuery(ROUTES.viewings.buyerList, { page: 1, limit: 6 })),
    getSessionJson<OffsetPaginatedResponse<VehicleRequestDto>>(withQuery(ROUTES.vehicleRequests.buyerList, { page: 1, limit: 6 })),
  ]);
  const catalogueItems: PublicListingCardDto[] = catalogueResult.ok ? catalogueResult.data.data : [];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-6 sm:p-8">
            <Badge variant="amber">Buyer workspace</Badge>
            <h1 className="display mt-5 max-w-3xl text-5xl leading-[0.92] text-[var(--ink-900)] sm:text-6xl">
              {buyerName(meResult.data)}, your next vehicle workflow starts here.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-500)]">
              Track saved vehicles, quote requests, viewing appointments, and fresh
              catalogue matches from one workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/vehicles" className={buttonVariants({ variant: "amber", size: "lg" })}>
                Browse vehicles
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/saved" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Open shortlist
              </Link>
            </div>
          </div>
          <div className="bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
              Real workflow actions
            </p>
            <div className="mt-6 grid gap-3">
              {BUYER_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:bg-white/10"
                >
                  <p className="font-semibold text-white">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{action.body}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#FFC72C]">
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Buyer workflow filters" className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-400)]">
            {activeWorkflow ? `Showing ${WORKFLOW_LABELS[activeWorkflow]}` : "Workflow overview"}
          </p>
          {activeWorkflow ? (
            <Link
              href="/buyer"
              aria-label="Clear workflow filter"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <X className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <StatusCard
            active={activeWorkflow === "saved"}
            href="/buyer?workflow=saved"
            icon={Heart}
            label="Saved"
            value={countFrom(savedResult)}
            helper="Vehicles in your shortlist"
          />
          <StatusCard
            active={activeWorkflow === "quotes"}
            href="/buyer?workflow=quotes"
            icon={Tags}
            label="Quotes"
            value={countFrom(quotesResult)}
            helper="Buyer quote requests"
          />
          <StatusCard
            active={activeWorkflow === "viewings"}
            href="/buyer?workflow=viewings"
            icon={CalendarDays}
            label="Viewings"
            value={countFrom(viewingsResult)}
            helper="Requested or scheduled"
          />
          <StatusCard
            active={activeWorkflow === "requests"}
            href="/buyer?workflow=requests"
            icon={CarFront}
            label="Requests"
            value={countFrom(requestsResult)}
            helper="Vehicle sourcing briefs"
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline">Live catalogue</Badge>
            <h2 className="display mt-3 text-3xl text-[var(--ink-900)]">Recommended next vehicles</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
              Pulled from the staging catalogue{buyerCity ? ` around ${buyerCity}` : ""}.
            </p>
          </div>
          <Link href="/vehicles" className={buttonVariants({ variant: "outline" })}>
            See all vehicles
          </Link>
        </div>

        {isServerApiFailure(catalogueResult) ? (
          <ErrorBanner message={catalogueResult.error.message} correlationId={catalogueResult.error.correlationId} />
        ) : catalogueItems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogueItems.map((listing) => (
              <VehicleCard key={listing.id} {...listing} signedIn />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            headline="No catalogue matches yet"
            body="The live catalogue is empty for your current city. Browse all vehicles to widen the search."
            cta={{ label: "Browse all vehicles", href: "/vehicles" }}
          />
        )}
      </section>
    </main>
  );
}
