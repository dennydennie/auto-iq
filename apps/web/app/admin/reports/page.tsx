import type { AdminOperationsReportDto } from "@auto-iq/contracts/admin";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ReportDownloadButton } from "@/components/admin/report-download-button";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const from = readValue(params.from);
  const to = readValue(params.to);
  const result = await getSessionJson<AdminOperationsReportDto>(withQuery(ROUTES.admin.operationsReport, { from, to }));
  if (isServerApiFailure(result)) return <main className="mx-auto max-w-6xl px-4 py-8"><ErrorBanner message={result.error.message} correlationId={result.error.correlationId} /></main>;
  const report = result.data;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Operational evidence" title="Reports" description="Review tenant activity and export the selected operational period." actions={<ReportDownloadButton report={report} />} />
    <form className="flex flex-col gap-3 rounded-3xl border border-[var(--ink-100)] bg-white p-4 sm:flex-row sm:items-end"><DateField name="from" label="From" value={from} /><DateField name="to" label="To" value={to} /><button className={buttonVariants({ variant: "amber" })}>Run report</button></form>
    <div className="grid gap-4 md:grid-cols-2">{reportSections(report).map(([section, metrics]) => <Card key={section}><CardHeader><CardTitle>{labelizeEnum(section)}</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3">{Object.entries(metrics).map(([metric, value]) => <div key={metric} className="rounded-2xl bg-[var(--ink-50)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--ink-400)]">{labelizeEnum(metric)}</p><p className="display mt-2 text-3xl text-[var(--ink-900)]">{value}</p></div>)}</CardContent></Card>)}</div>
  </main>;
}
function DateField({ name, label, value }: { name: string; label: string; value: string }) { return <label className="grid gap-2 text-sm font-semibold text-[var(--ink-700)]">{label}<Input name={name} type="date" defaultValue={value} /></label>; }
function readValue(value: string | string[] | undefined) { return Array.isArray(value) ? (value[0] ?? "") : (value ?? ""); }
function reportSections(report: AdminOperationsReportDto) { return [["users", report.users], ["listings", report.listings], ["viewings", report.viewings], ["notifications", report.notifications]] as const; }
