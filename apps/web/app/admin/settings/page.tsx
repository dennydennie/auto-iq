import type {
  AdminReferenceOptionDto,
  AdminViewingLocationDto,
} from "@auto-iq/contracts/admin";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ReferenceOptionManager } from "@/components/admin/reference-option-manager";
import { ViewingLocationManager } from "@/components/admin/viewing-location-manager";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionJson, isServerApiFailure, withQuery } from "@/lib/server-api";

export default async function AdminSettingsPage() {
  const [optionsResult, locationsResult] = await Promise.all([
    getSessionJson<OffsetPaginatedResponse<AdminReferenceOptionDto>>(
      withQuery(ROUTES.admin.referenceOptions, { page: 1, limit: 100 }),
    ),
    getSessionJson<OffsetPaginatedResponse<AdminViewingLocationDto>>(
      withQuery(ROUTES.admin.viewingLocations, { page: 1, limit: 100 }),
    ),
  ]);
  if (isServerApiFailure(optionsResult)) return <main className="mx-auto max-w-6xl px-4 py-8"><ErrorBanner message={optionsResult.error.message} correlationId={optionsResult.error.correlationId} /></main>;
  if (isServerApiFailure(locationsResult)) return <main className="mx-auto max-w-6xl px-4 py-8"><ErrorBanner message={locationsResult.error.message} correlationId={locationsResult.error.correlationId} /></main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Tenant configuration" title="Settings" description="Manage evolving vehicle taxonomy and approved viewing locations without a deployment." />
      <Card><CardHeader><CardTitle>Vehicle reference catalogue</CardTitle><p className="text-sm text-[var(--ink-500)]">New values are available immediately in web and mobile forms. Deactivate obsolete choices without changing historical listings.</p></CardHeader><CardContent><ReferenceOptionManager options={optionsResult.data.data} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Approved viewing locations</CardTitle><p className="text-sm text-[var(--ink-500)]">Only active, tenant-approved locations can be offered for protected viewings.</p></CardHeader><CardContent><ViewingLocationManager locations={locationsResult.data.data} /></CardContent></Card>
    </main>
  );
}
