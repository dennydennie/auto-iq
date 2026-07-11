import type { InspectionTaskDetailDto } from "@auto-iq/contracts/inspections";
import { ROUTES } from "@auto-iq/contracts/routes";
import { InspectionReportForm } from "@/components/inspector/inspection-report-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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
            <div className="space-y-3">
              <p className="text-3xl font-semibold text-[var(--ink-900)]">
                {report.overallScore}/100
              </p>
              <p className="text-sm text-[var(--ink-500)]">
                {report.inspectorNote}
              </p>
              <p className="text-sm font-semibold">
                {report.roadworthy ? "Roadworthy" : "Not roadworthy"}
              </p>
            </div>
          ) : (
            <InspectionReportForm taskId={task.id} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
