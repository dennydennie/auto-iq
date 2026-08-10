import Image from "next/image";
import Link from "next/link";
import type { InspectionTaskDetailDto } from "@auto-iq/contracts/inspections";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowLeft, ClipboardCheck, MapPin } from "lucide-react";
import { AdminInspectionSummaryForm } from "@/components/admin/admin-inspection-summary-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { formatDate } from "@/lib/format";
import { shouldBypassNextImageOptimization } from "@/lib/image-url";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

export default async function AdminInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSessionJson<InspectionTaskDetailDto>(
    ROUTES.admin.inspectionTask(id),
  );

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        {result.error.statusCode === 404 ? (
          <EmptyState
            icon={ClipboardCheck}
            headline="Inspection not found"
            body="This inspection task could not be loaded."
            cta={{ label: "Back to inspections", href: "/admin/inspections" }}
          />
        ) : (
          <ErrorBanner
            message={result.error.message}
            correlationId={result.error.correlationId}
          />
        )}
      </main>
    );
  }

  const { task, report } = result.data;
  const title = `${task.listingSnapshot.year} ${task.listingSnapshot.make} ${task.listingSnapshot.model}`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Inspections", href: "/admin/inspections" },
          { label: title },
        ]}
      />
      <Link
        href="/admin/inspections"
        className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inspections
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="warning">{labelizeEnum(task.status)}</Badge>
                  <CardTitle className="mt-3">{title}</CardTitle>
                </div>
                <Link
                  href={`/admin/listings/${task.listingId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open listing
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Inspector" value={task.assignedInspectorName ?? "Unassigned"} />
              <Detail
                label="Scheduled"
                value={task.scheduledAt ? formatDate(task.scheduledAt) : "Not scheduled"}
              />
              <Detail
                label="Completed"
                value={task.completedAt ? formatDate(task.completedAt) : "Not completed"}
              />
              <Detail
                label="Location"
                value={task.listingSnapshot.city || "Location pending"}
                icon
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inspection findings</CardTitle>
            </CardHeader>
            <CardContent>
              {!report ? (
                <EmptyState
                  icon={ClipboardCheck}
                  headline="Report not submitted"
                  body="The assigned inspector must complete the checklist before admin review."
                />
              ) : (
                <div className="space-y-4">
                  {report.findings.map((finding) => (
                    <article
                      key={finding.id}
                      className="grid gap-4 rounded-[1.25rem] border border-[var(--ink-100)] p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{labelizeEnum(finding.category)}</Badge>
                          <Badge variant={finding.rating === "PASS" ? "success" : "warning"}>
                            {labelizeEnum(finding.rating)}
                          </Badge>
                        </div>
                        <h3 className="mt-3 font-semibold text-[var(--ink-900)]">
                          {finding.label}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--ink-500)]">
                          {finding.note || "No observation note supplied."}
                        </p>
                      </div>
                      {finding.photoUrl ? (
                        <a href={finding.photoUrl} target="_blank" rel="noreferrer">
                          <Image
                            src={finding.photoUrl}
                            alt={`${finding.label} inspection evidence`}
                            width={128}
                            height={96}
                            className="h-24 w-32 rounded-xl object-cover"
                            unoptimized={shouldBypassNextImageOptimization(finding.photoUrl)}
                          />
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {report ? (
            <Card>
              <CardHeader>
                <CardTitle>Report summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4 rounded-[1.25rem] bg-[var(--ink-900)] p-4 text-white">
                  <ScoreGauge
                    score={report.overallScore}
                    size={76}
                    light
                    ariaLabel={`Inspection score ${report.overallScore} out of 100`}
                  />
                  <div>
                    <p className="font-semibold">{report.roadworthy ? "Roadworthy" : "Not roadworthy"}</p>
                    <p className="mt-1 text-sm text-white/70">
                      Submitted by {report.submittedByInspectorName}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-7 text-[var(--ink-500)]">
                  {report.inspectorNote}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {report && !report.buyerSummaryApproved ? (
            <Card>
              <CardHeader>
                <CardTitle>Buyer-safe summary</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminInspectionSummaryForm listingId={task.listingId} report={report} />
              </CardContent>
            </Card>
          ) : null}

          {report?.buyerSummaryApproved ? (
            <NoticeBanner message="Buyer inspection summary approved and available to the publish workflow." />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
  icon = false,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">{label}</p>
      <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-900)]">
        {icon ? <MapPin className="h-4 w-4 text-[var(--amber-dark)]" /> : null}
        {value}
      </p>
    </div>
  );
}
