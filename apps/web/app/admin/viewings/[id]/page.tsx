import Link from "next/link";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { ArrowLeft, CalendarClock, MapPinned, Users } from "lucide-react";
import { AdminViewingActions } from "@/components/admin/admin-viewing-actions";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";
import { viewingStatusTone } from "@/lib/vehicle-ui";

function readReturnHref(value: string | string[] | undefined, fallback: string) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return fallback;
  return candidate.startsWith("/admin/") ? candidate : fallback;
}

export default async function AdminViewingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { return: returnParam } = await searchParams;
  const backHref = readReturnHref(returnParam, "/admin/viewings");
  const [viewingResult, referenceResult] = await Promise.all([
    getSessionJson<ViewingDto>(ROUTES.admin.viewing(id)),
    getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all),
  ]);

  if (isServerApiFailure(viewingResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {viewingResult.error.statusCode === 404 ? (
          <EmptyState
            icon={CalendarClock}
            headline="Viewing not found"
            body="This viewing could not be loaded from the admin endpoint."
            cta={{ label: "Back to viewing scheduler", href: backHref }}
          />
        ) : viewingResult.error.statusCode === 401 || viewingResult.error.statusCode === 403 ? (
          <EmptyState
            icon={CalendarClock}
            headline="Admin sign-in required"
            body="Sign in with an admin account to load this viewing."
            cta={{ label: "Go to admin login", href: "/admin/login" }}
          />
        ) : (
          <ErrorBanner message={viewingResult.error.message} correlationId={viewingResult.error.correlationId} />
        )}
      </main>
    );
  }

  const viewing = viewingResult.data;
  const locations = !isServerApiFailure(referenceResult)
    ? referenceResult.data.viewingLocations.filter((location) => location.active)
    : [];
  const title = `${viewing.listingSnapshot.year} ${viewing.listingSnapshot.make} ${viewing.listingSnapshot.model}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Viewings", href: backHref },
          { label: title },
        ]}
      />

      <Link href={backHref} className={buttonVariants({ variant: "ghost", className: "mb-4 px-0" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to viewing scheduler
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant={viewingStatusTone(viewing.status)}>{viewing.status}</Badge>
                  <CardTitle className="mt-3">{title}</CardTitle>
                </div>
                <Link
                  href={`/admin/listings/${viewing.listingId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open listing
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                  <CalendarClock className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
                  Preferred slot
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{formatDate(viewing.preferredSlot)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                  <CalendarClock className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
                  Confirmed slot
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">
                  {viewing.confirmedSlot ? formatDate(viewing.confirmedSlot) : "Not yet confirmed"}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                  <MapPinned className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
                  Location
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">
                  {viewing.location ? `${viewing.location.name}, ${viewing.location.city}` : "Pending"}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                  <Users className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
                  Buyer
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">{viewing.buyerName}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--ink-500)]">
              {viewing.participants.length === 0 ? (
                <p>No participants recorded yet.</p>
              ) : viewing.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between rounded-[1rem] border border-[var(--ink-100)] px-3 py-2"
                >
                  <span className="font-semibold text-[var(--ink-900)]">{participant.name}</span>
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
                    {participant.role} · {participant.confirmed ? "Confirmed" : "Not confirmed"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {viewing.note || viewing.outcomeNote ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-[var(--ink-500)]">
                {viewing.note ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Buyer note</p>
                    <p className="mt-1 text-[var(--ink-900)]">{viewing.note}</p>
                  </div>
                ) : null}
                {viewing.outcomeNote ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">Outcome note</p>
                    <p className="mt-1 text-[var(--ink-900)]">{viewing.outcomeNote}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminViewingActions viewing={viewing} locations={locations} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
