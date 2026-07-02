import { cache, Suspense } from "react";
import Link from "next/link";
import type { AdminDashboardDto } from "@auto-iq/contracts/admin";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Calendar, ListTodo, Tickets } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCardSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

// Dedupe the dashboard fetch across the three async sections that consume it.
// React's `cache()` returns the same promise for the lifetime of the request,
// so only one network call hits the API even though three Suspense boundaries
// await it independently.
const fetchDashboard = cache(() =>
  getSessionJson<AdminDashboardDto>(ROUTES.admin.dashboard),
);

function ListItemFallback() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--ink-100)]" />
        <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--ink-100)]" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-[var(--ink-100)]" />
      </CardContent>
    </Card>
  );
}

async function KpiStats() {
  const result = await fetchDashboard();
  if (isServerApiFailure(result)) return null;
  const dashboard = result.data;
  const adminStats = [
    { label: "Approval queue", value: dashboard.queues.pendingReview, icon: ListTodo },
    { label: "Viewings today", value: dashboard.viewingsTodayCount, icon: Calendar },
    { label: "Open buyer requests", value: dashboard.openVehicleRequestCount, icon: Tickets },
  ];

  return (
    <>
      {/* Trend deltas not yet exposed by /admin/dashboard — pass `trend={{ delta, period }}` once the API ships diffs. */}
      {adminStats.map(({ label, value, icon }) => (
        <StatCard key={label} label={label} value={value} icon={icon} period="Current snapshot" />
      ))}
    </>
  );
}

async function QueueBreakdown() {
  const result = await fetchDashboard();
  if (isServerApiFailure(result)) return null;
  const dashboard = result.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--ink-500)]">
        <div className="flex items-center justify-between">
          <span>Pending review</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.queues.pendingReview}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Changes requested</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.queues.changesRequested}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Ownership pending</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.queues.ownershipPending}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Ready to publish</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.queues.readyToPublish}</span>
        </div>
      </CardContent>
    </Card>
  );
}

async function CommercialPipeline() {
  const result = await fetchDashboard();
  if (isServerApiFailure(result)) return null;
  const dashboard = result.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commercial pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--ink-500)]">
        <div className="flex items-center justify-between">
          <span>Open quotes</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.openQuoteCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Buyer requests</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.openVehicleRequestCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Recent activity</span>
          <span className="font-semibold text-[var(--ink-900)]">{dashboard.recentActivityCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}

async function DashboardErrorBoundary() {
  const result = await fetchDashboard();
  if (!isServerApiFailure(result)) return null;
  if (result.error.statusCode === 401 || result.error.statusCode === 403) {
    return (
      <EmptyState
        icon={ListTodo}
        headline="Admin sign-in required"
        body="Sign in with an admin account to load queue counts and moderation activity."
        cta={{ label: "Go to admin login", href: "/admin/login" }}
      />
    );
  }
  return (
    <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
  );
}

export default function AdminHomePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin overview"
        title="Operations dashboard"
        description="Moderation queues, viewing activity, and buyer requests that need operator attention."
        actions={
          <>
            <Link href="/admin/listings" className={buttonVariants({ variant: "amber", size: "sm" })}>
              Moderation queue
            </Link>
            <Link href="/admin/viewings" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Viewings
            </Link>
          </>
        }
      />

      <Suspense fallback={null}>
        <DashboardErrorBoundary />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-3">
        <Suspense
          fallback={
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          }
        >
          <KpiStats />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<ListItemFallback />}>
          <QueueBreakdown />
        </Suspense>
        <Suspense fallback={<ListItemFallback />}>
          <CommercialPipeline />
        </Suspense>
      </div>
    </main>
  );
}
