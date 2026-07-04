import Link from "next/link";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { QuoteDto } from "@auto-iq/contracts/quotes";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowRight, MessageSquareQuote } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/format";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const STATUS_TONE: Record<
  QuoteDto["status"],
  { tone: "success" | "warning" | "outline"; label: string }
> = {
  NEW: { tone: "warning", label: "New" },
  UNDER_REVIEW: { tone: "warning", label: "Under review" },
  ACCEPTED: { tone: "success", label: "Accepted" },
  COUNTERED: { tone: "warning", label: "Countered" },
  DECLINED: { tone: "outline", label: "Declined" },
  WITHDRAWN: { tone: "outline", label: "Withdrawn" },
  EXPIRED: { tone: "outline", label: "Expired" },
  CANCELLED: { tone: "outline", label: "Cancelled" },
};

const BUYER_LINKS = [
  { href: "/buy-a-car", label: "Buy a Car" },
  { href: "/vehicles", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/quotes", label: "Quotes" },
  { href: "/viewings", label: "Viewings" },
  { href: "/seller", label: "Sell My Car" },
];

const GUEST_LINKS = [
  { href: "/buy-a-car", label: "Buy a Car" },
  { href: "/sell-my-car", label: "Sell My Car" },
  { href: "/vehicles", label: "Browse" },
  { href: "/about", label: "About" },
];

function quotesHref(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/quotes?${query}` : "/quotes";
}

export default async function BuyerQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const result = await getSessionJson<OffsetPaginatedResponse<QuoteDto>>(
    withQuery(ROUTES.quotes.buyerList, { page, limit: 12 }),
  );

  if (isServerApiFailure(result)) {
    return (
      <>
        <SiteHeader
          links={GUEST_LINKS}
          homeHref="/"
          primaryCta={{ href: "/auth/login?next=/quotes", label: "Sign in" }}
        />
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
            <EmptyState
              icon={MessageSquareQuote}
              headline="Sign in to see your quotes"
              body="Quote requests you send to sellers appear here with real-time status."
              cta={{ label: "Go to login", href: "/auth/login?next=/quotes" }}
            />
          ) : (
            <ErrorBanner
              message={result.error.message}
              correlationId={result.error.correlationId}
            />
          )}
        </main>
      </>
    );
  }

  const quotes = result.data;

  return (
    <>
      <SiteHeader
        links={BUYER_LINKS}
        homeHref="/vehicles"
        signedIn
      />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Buyer workspace"
          title="Your quote requests"
          description="Track offers you've sent — including counter-offers and seller responses."
        />

        {quotes.data.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            headline="No quotes yet"
            body="Open a vehicle detail page and use the Request a quote form to send your first offer."
            cta={{ label: "Browse catalogue", href: "/vehicles" }}
          />
        ) : (
          <div className="space-y-4">
            {quotes.data.map((quote) => {
              const status = STATUS_TONE[quote.status] ?? { tone: "outline" as const, label: quote.status };
              const priceDelta = quote.offerPriceUsd - quote.askPriceUsd;
              return (
                <Card key={quote.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={status.tone}>{status.label}</Badge>
                        <span className="text-xs text-[var(--ink-400)]">
                          Sent {formatDate(quote.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--ink-500)]">
                        Your offer{" "}
                        <span className="font-semibold text-[var(--ink-900)]">
                          {formatPrice(quote.offerPriceUsd, "USD")}
                        </span>
                        {" "}· asking {formatPrice(quote.askPriceUsd, "USD")}
                        {priceDelta !== 0 ? (
                          <span className={priceDelta < 0 ? "text-emerald-600" : "text-[var(--reject)]"}>
                            {" "}({priceDelta > 0 ? "+" : ""}
                            {formatPrice(priceDelta, "USD")})
                          </span>
                        ) : null}
                      </p>
                      {quote.counterPriceUsd !== null ? (
                        <p className="text-sm text-[var(--ink-500)]">
                          Counter offer:{" "}
                          <span className="font-semibold text-[var(--ink-900)]">
                            {formatPrice(quote.counterPriceUsd, "USD")}
                          </span>
                          {quote.responseNote ? ` — ${quote.responseNote}` : ""}
                        </p>
                      ) : null}
                      {quote.message ? (
                        <p className="text-xs italic text-[var(--ink-400)]">
                          &ldquo;{quote.message}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/vehicles/${quote.listingId}#contact`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View listing
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {quotes.data.length > 0 ? (
          <PaginationFooter
            page={quotes.meta.page}
            totalPages={quotes.meta.totalPages}
            limit={quotes.meta.limit}
            total={quotes.meta.total}
            buildHref={quotesHref}
          />
        ) : null}
      </main>
    </>
  );
}
