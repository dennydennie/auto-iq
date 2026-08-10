import type { InspectionTaskDetailDto } from "@auto-iq/contracts/inspections";
import { ROUTES } from "@auto-iq/contracts/routes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InspectionReportForm } from "@/components/inspector/inspection-report-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

export default async function InspectorTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSessionJson<InspectionTaskDetailDto>(
    ROUTES.inspectors.taskDetail(id),
  );
  if (isServerApiFailure(result))
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBanner
          message={result.error.message}
          correlationId={result.error.correlationId}
        />
      </main>
    );
  const { task, report } = result.data;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/inspector/tasks"
        className={buttonVariants({ variant: "ghost", className: "px-0" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assigned inspections
      </Link>
      <PageHeader
        eyebrow="Inspection task"
        title={`${task.listingSnapshot.year} ${task.listingSnapshot.make} ${task.listingSnapshot.model}`}
        description={`${task.listingSnapshot.city} · ${labelizeEnum(task.status)}`}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inspection report</CardTitle>
            <Badge variant="warning">{labelizeEnum(task.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {report ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-[var(--ink-50)] p-4">
                <div>
                  <p className="text-3xl font-semibold text-[var(--ink-900)]">
                    {report.overallScore}/100
                  </p>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">
                    {report.roadworthy ? "Roadworthy" : "Not roadworthy"}
                  </p>
                </div>
                <Badge variant={report.buyerSummaryApproved ? "success" : "warning"}>
                  {report.buyerSummaryApproved ? "Summary approved" : "Awaiting admin review"}
                </Badge>
              </div>
              <p className="text-sm leading-7 text-[var(--ink-500)]">
                {report.inspectorNote}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {report.findings.map((finding) => (
                  <article
                    key={finding.id}
                    className="rounded-[1.1rem] border border-[var(--ink-100)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{labelizeEnum(finding.category)}</Badge>
                      <Badge variant={finding.rating === "PASS" ? "success" : "warning"}>
                        {labelizeEnum(finding.rating)}
                      </Badge>
                    </div>
                    <p className="mt-3 font-semibold text-[var(--ink-900)]">{finding.label}</p>
                    <p className="mt-1 text-sm text-[var(--ink-500)]">
                      {finding.note || "No observation note."}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <InspectionReportForm taskId={task.id} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
