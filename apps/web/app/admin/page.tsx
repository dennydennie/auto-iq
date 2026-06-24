import Link from "next/link";
import type { AdminDashboardDto } from "@auto-iq/contracts/admin";
import { ROUTES } from "@auto-iq/contracts/routes";
import { Calendar, ListTodo, Sparkles, Tickets } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function AdminHomePage() {
  const result = await getSessionJson<AdminDashboardDto>(ROUTES.admin.dashboard);

  if (isServerApiFailure(result)) {
    return (
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {result.error.statusCode === 401 || result.error.statusCode === 403 ? (
          <EmptyState
            icon={ListTodo}
            headline="Admin sign-in required"
            body="Sign in with an admin account to load queue counts and moderation activity."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
        )}
      </main>
    );
  }

  const dashboard = result.data;
  const adminStats = [
    { label: "Approval queue", value: dashboard.queues.pendingReview, icon: ListTodo },
    { label: "Viewings today", value: dashboard.viewingsTodayCount, icon: Calendar },
    { label: "Open buyer requests", value: dashboard.openVehicleRequestCount, icon: Tickets },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <Badge variant="outline">Admin overview</Badge>
        <div className="mt-4">
          <h1 className="display text-4xl text-[var(--ink-900)] sm:text-5xl">
            Operations dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
            Review moderation queues, viewing activity, and buyer requests that need
            operator attention.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {adminStats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--amber-dark)]">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="display text-4xl text-[var(--ink-900)]">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
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
          <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-[#FFC72C]" />
              <div>
                <h2 className="display text-2xl">Quick access</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/72">
                  The moderation queue and viewing operations screens are also on live API reads now.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link href="/admin/listings" className={buttonVariants({ variant: "amber", className: "justify-center" })}>
                    Open moderation queue
                  </Link>
                  <Link href="/admin/viewings" className={buttonVariants({ variant: "outline", className: "justify-center border-white/20 bg-white/5 text-white hover:bg-white/10" })}>
                    Open viewing operations
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
