import type { QuoteStatus } from "@auto-iq/contracts/enums";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import type { QuoteDto } from "@auto-iq/contracts/quotes";
import { ROUTES } from "@auto-iq/contracts/routes";
import { MessageSquareQuote } from "lucide-react";
import { AdminQuoteActions } from "@/components/admin/admin-quote-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const STATUSES: QuoteStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "ACCEPTED",
  "COUNTERED",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
  "CANCELLED",
];

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const status = readValue(params.status);
  const result = await getSessionJson<OffsetPaginatedResponse<QuoteDto>>(
    withQuery(ROUTES.admin.quotes, {
      page,
      limit: 12,
      status,
      sortBy: "updatedAt",
      sortDir: "DESC",
    }),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Buyer offers"
        title="Quote review"
        description="Review incoming offers and send a clear response back to each buyer."
      />
      <form className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4 sm:flex-row">
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelizeEnum(value)}
            </option>
          ))}
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>
          Apply filter
        </button>
      </form>
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          headline="No quotes found"
          body="New buyer offers appear here as soon as they are submitted."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.data.data.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="warning">{labelizeEnum(quote.status)}</Badge>
                  <span className="text-xs text-[var(--ink-400)]">
                    {formatDate(quote.createdAt)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink-900)]">
                    {quote.buyerName || "Buyer"}
                  </p>
                  <p className="text-sm text-[var(--ink-500)]">
                    Offer {formatPrice(quote.offerPriceUsd, "USD")} · asking{" "}
                    {formatPrice(quote.askPriceUsd, "USD")}
                  </p>
                </div>
                {quote.message ? (
                  <p className="rounded-xl bg-[var(--ink-50)] p-3 text-sm text-[var(--ink-500)]">
                    {quote.message}
                  </p>
                ) : null}
                <AdminQuoteActions quote={quote} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <PaginationFooter
        page={result.data.meta.page}
        totalPages={result.data.meta.totalPages}
        limit={result.data.meta.limit}
        total={result.data.meta.total}
        buildHref={(nextPage) => quotesHref(nextPage, status)}
      />
    </main>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function quotesHref(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  return params.size ? `/admin/quotes?${params}` : "/admin/quotes";
}
