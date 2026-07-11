import type { InspectionTaskStatus } from "@auto-iq/contracts/enums";
import type { InspectionTaskDto } from "@auto-iq/contracts/inspections";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  getSessionJson,
  isServerApiFailure,
  withQuery,
} from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const STATUSES: InspectionTaskStatus[] = [
  "UNASSIGNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "BUYER_SUMMARY_APPROVED",
];

export default async function InspectorTasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = readValue(params.status);
  const page = Number(readValue(params.page) || "1") || 1;
  const result = await getSessionJson<
    OffsetPaginatedResponse<InspectionTaskDto>
  >(withQuery(ROUTES.inspectors.taskList, { status, page, limit: 20 }));
  if (isServerApiFailure(result))
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Inspector workspace"
        title="Assigned inspections"
        description="Open an assigned task, capture findings, and submit the roadworthiness report."
      />
      <form className="flex gap-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4">
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelizeEnum(value)}
            </option>
          ))}
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>
      {result.data.data.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          headline="No inspection tasks"
          body="No assigned tasks match the selected status."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.data.data.map((task) => (
            <Card key={task.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="warning">{labelizeEnum(task.status)}</Badge>
                  <span className="text-xs text-[var(--ink-400)]">
                    {task.scheduledAt
                      ? formatDate(task.scheduledAt)
                      : "Not scheduled"}
                  </span>
                </div>
                <p className="font-semibold text-[var(--ink-900)]">
                  {task.listingSnapshot.year} {task.listingSnapshot.make}{" "}
                  {task.listingSnapshot.model}
                </p>
                <p className="text-sm text-[var(--ink-500)]">
                  {task.listingSnapshot.city}
                </p>
                <Link
                  href={`/inspector/tasks/${task.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Open task
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {result.data.data.length > 0 ? (
        <PaginationFooter
          page={result.data.meta.page}
          totalPages={result.data.meta.totalPages}
          limit={result.data.meta.limit}
          total={result.data.meta.total}
          buildHref={(nextPage) => tasksHref(nextPage, status)}
        />
      ) : null}
    </main>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function tasksHref(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  return params.size ? `/inspector/tasks?${params}` : "/inspector/tasks";
}
