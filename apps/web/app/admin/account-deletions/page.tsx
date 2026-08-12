import type {
  AccountDeletionRequestStatus,
  AdminAccountDeletionRequestDto,
} from "@auto-iq/contracts/admin";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Trash2 } from "lucide-react";
import { AdminAccountDeletionActions } from "@/components/admin/admin-account-deletion-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAccountDeletionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const search = readValue(params.search);
  const status = readStatus(params.status);
  const result = await getSessionJson<
    OffsetPaginatedResponse<AdminAccountDeletionRequestDto>
  >(
    withQuery(ROUTES.admin.accountDeletionRequests, {
      page,
      limit: 20,
      search,
      status,
    }),
  );

  if (isServerApiFailure(result)) {
    return (
      <WorkspacePage>
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="space-y-6">
      <PageHeader
        eyebrow="Privacy operations"
        title="Account deletions"
        description="Verify requests, record deletion or de-identification evidence, and preserve an auditable retention decision."
      />
      <div className="rounded-3xl border border-[var(--pending)]/25 bg-[var(--pending-soft)] p-4 text-sm leading-6 text-[var(--ink-700)]">
        Completing a request is an operator attestation. First verify ownership,
        perform the required deletion or de-identification, and document the
        basis for anything retained.
      </div>
      <form className="grid gap-3 rounded-3xl border border-[var(--ink-100)] bg-white p-4 md:grid-cols-[1fr_12rem_auto]">
        <Input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search account email"
          aria-label="Search account deletion requests"
        />
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={Trash2}
          headline="No deletion requests found"
          body="No account deletion requests match the selected filters."
        />
      ) : (
        <div className="grid gap-5">
          {result.data.data.map((request) => (
            <article
              key={request.id}
              className="rounded-3xl border border-[var(--ink-100)] bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--ink-900)]">
                    {request.email}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-500)]">
                    Requested {formatDate(request.requestedAt)} ·{" "}
                    {labelizeEnum(request.source)}
                  </p>
                </div>
                <Badge variant={statusVariant(request.status)}>
                  {labelizeEnum(request.status)}
                </Badge>
              </div>
              <div className="mt-4 rounded-2xl bg-[var(--ink-50)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                <span className="font-semibold">Requester note:</span>{" "}
                {request.reason ?? "No reason supplied."}
              </div>
              {request.status === "PENDING" ? (
                <AdminAccountDeletionActions request={request} />
              ) : (
                <div className="mt-5 border-t border-[var(--ink-100)] pt-5 text-sm leading-6 text-[var(--ink-500)]">
                  <p>
                    {request.processingNote ??
                      "No operator evidence was captured for this legacy decision."}
                  </p>
                  <p className="mt-2">
                    {request.processedAt
                      ? `Processed ${formatDate(request.processedAt)}`
                      : "Processing timestamp unavailable"}
                    {request.processedBy
                      ? ` by ${request.processedBy.fullName}`
                      : ""}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <PaginationFooter
        {...result.data.meta}
        buildHref={(nextPage) =>
          deletionRequestsHref(nextPage, search, status)
        }
      />
    </WorkspacePage>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function readStatus(
  value: string | string[] | undefined,
): AccountDeletionRequestStatus | "" {
  const status = readValue(value);
  return ["PENDING", "COMPLETED", "CANCELLED"].includes(status)
    ? (status as AccountDeletionRequestStatus)
    : "";
}

function statusVariant(status: AccountDeletionRequestStatus) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "outline" as const;
}

function deletionRequestsHref(
  page: number,
  search: string,
  status: AccountDeletionRequestStatus | "",
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return params.size ? `/admin/account-deletions?${params}` : "/admin/account-deletions";
}
