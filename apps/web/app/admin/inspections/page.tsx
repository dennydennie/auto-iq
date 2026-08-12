import Link from "next/link";
import type { InspectionTaskStatus } from "@auto-iq/contracts/enums";
import type { InspectionTaskDto } from "@auto-iq/contracts/inspections";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ClipboardCheck, MapPin } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { WorkspacePage } from "@/components/shared/workspace-page";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
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

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function inspectionsHref(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  return params.size ? `/admin/inspections?${params}` : "/admin/inspections";
}

function currentPageCount(
  tasks: InspectionTaskDto[],
  status: InspectionTaskStatus,
) {
  return tasks.filter((task) => task.status === status).length;
}

export default async function AdminInspectionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const status = readValue(params.status);
  const result = await getSessionJson<
    OffsetPaginatedResponse<InspectionTaskDto>
  >(withQuery(ROUTES.admin.inspectionTasks, { page, limit: 12, status }));

  if (isServerApiFailure(result)) {
    return (
      <WorkspacePage>
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={ClipboardCheck}
            headline="Admin sign-in required"
            body="Sign in with an admin account to manage vehicle inspections."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner
            message={result.error.message}
            correlationId={result.error.correlationId}
          />
        )}
      </WorkspacePage>
    );
  }

  const tasks = result.data;
  return (
    <WorkspacePage className="space-y-6">
      <PageHeader
        eyebrow="Inspection operations"
        title="Vehicle inspections"
        description="Track assignments, review submitted reports, and approve buyer-safe summaries."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Scheduled"
          value={currentPageCount(tasks.data, "SCHEDULED")}
          period="Current page"
        />
        <StatCard
          label="Awaiting review"
          value={currentPageCount(tasks.data, "REPORT_SUBMITTED")}
          period="Current page"
        />
        <StatCard
          label="Summary approved"
          value={currentPageCount(tasks.data, "BUYER_SUMMARY_APPROVED")}
          period="Current page"
        />
      </div>

      <form className="flex gap-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4">
        <Select
          name="status"
          defaultValue={status}
          aria-label="Inspection status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelizeEnum(value)}
            </option>
          ))}
        </Select>
        <button className={buttonVariants({ variant: "amber" })}>Apply</button>
      </form>

      {tasks.data.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          headline="No inspections found"
          body="Assign an inspector from a submitted listing to start the workflow."
          cta={{
            label: "Open submitted listings",
            href: "/admin/listings?status=SUBMITTED",
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {tasks.data.map((task) => (
            <Link
              key={task.id}
              href={`/admin/inspections/${task.id}`}
              className="rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
            >
              <Card className="h-full transition hover:shadow-[0_24px_60px_-30px_rgba(22,31,58,0.35)]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="warning">{labelizeEnum(task.status)}</Badge>
                    <span className="text-xs text-[var(--ink-400)]">
                      {task.scheduledAt
                        ? formatDate(task.scheduledAt)
                        : "Unscheduled"}
                    </span>
                  </div>
                  <CardTitle className="mt-3">
                    {task.listingSnapshot.year} {task.listingSnapshot.make}{" "}
                    {task.listingSnapshot.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[var(--ink-500)]">
                  <p>
                    {task.assignedInspectorName ?? "Inspector not assigned"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--amber-dark)]" />
                    {task.listingSnapshot.city || "Location pending"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PaginationFooter
        page={tasks.meta.page}
        totalPages={tasks.meta.totalPages}
        limit={tasks.meta.limit}
        total={tasks.meta.total}
        buildHref={(targetPage) => inspectionsHref(targetPage, status)}
      />
    </WorkspacePage>
  );
}
