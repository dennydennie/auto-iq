import type { NotificationStatus } from "@auto-iq/contracts/enums";
import type { NotificationDto } from "@auto-iq/contracts/notifications";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { BellRing } from "lucide-react";
import { NotificationRetryAction } from "@/components/admin/notification-retry-action";
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
const STATUSES: NotificationStatus[] = [
  "QUEUED",
  "SENT",
  "FAILED",
  "DEAD_LETTER",
];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(readValue(params.page) || "1") || 1;
  const status = readValue(params.status);
  const result = await getSessionJson<OffsetPaginatedResponse<NotificationDto>>(
    withQuery(ROUTES.admin.notifications, {
      page,
      limit: 20,
      status,
      sortBy: "lastAttemptAt",
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
        eyebrow="Delivery operations"
        title="Notifications"
        description="Inspect delivery outcomes and retry failed or dead-letter messages."
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
          icon={BellRing}
          headline="No notifications found"
          body="No delivery records match the selected status."
        />
      ) : (
        <div className="space-y-3">
          {result.data.data.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        notification.status === "SENT"
                          ? "success"
                          : notification.status === "FAILED" ||
                              notification.status === "DEAD_LETTER"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {labelizeEnum(notification.status)}
                    </Badge>
                    <span className="text-xs text-[var(--ink-400)]">
                      {formatDate(
                        notification.lastAttemptAt ?? notification.createdAt,
                      )}
                    </span>
                  </div>
                  <p className="font-semibold text-[var(--ink-900)]">
                    {labelizeEnum(notification.template)} ·{" "}
                    {notification.channel}
                  </p>
                  <p className="text-sm text-[var(--ink-500)]">
                    {notification.recipientName || "Recipient"} ·{" "}
                    {notification.attemptCount} attempt
                    {notification.attemptCount === 1 ? "" : "s"}
                  </p>
                </div>
                <NotificationRetryAction notification={notification} />
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
        buildHref={(nextPage) => notificationsHref(nextPage, status)}
      />
    </main>
  );
}

function readValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function notificationsHref(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  return params.size
    ? `/admin/notifications?${params}`
    : "/admin/notifications";
}
