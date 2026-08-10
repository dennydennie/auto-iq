"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminListingDto } from "@auto-iq/contracts/admin";
import type { OwnershipVerificationStatus } from "@auto-iq/contracts/enums";
import type { InspectorOptionDto } from "@auto-iq/contracts/inspections";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

type OwnershipDecision = Exclude<OwnershipVerificationStatus, "NOT_STARTED">;

function initialOwnershipDecision(listing: AdminListingDto): OwnershipDecision {
  const status = listing.ownershipVerification?.status;
  return status && status !== "NOT_STARTED" ? status : "IN_REVIEW";
}

export function AdminVerificationActions({
  listing,
  inspectors,
}: {
  listing: AdminListingDto;
  inspectors: InspectorOptionDto[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipDecision>(
    () => initialOwnershipDecision(listing),
  );
  const [note, setNote] = useState(listing.ownershipVerification?.note ?? "");
  const [inspectorId, setInspectorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule());
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: string, body: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const result = await postJson<AdminListingDto>(
        `/api/admin/listings/${listing.id}/${action}`,
        body,
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      toast({
        title: "Verification updated",
        description: "The listing checklist has been refreshed.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}
      <section className="space-y-3">
        <h3 className="font-semibold text-[var(--ink-900)]">
          Ownership review
        </h3>
        <Select
          aria-label="Ownership decision"
          value={ownershipStatus}
          onChange={(event) =>
            setOwnershipStatus(event.target.value as OwnershipDecision)
          }
        >
          <option value="IN_REVIEW">In review</option>
          <option value="APPROVED">Approved</option>
          <option value="NEEDS_CLARIFICATION">Needs clarification</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Label htmlFor="ownership-review-note">Ownership review note</Label>
        <Textarea
          id="ownership-review-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Review note"
        />
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            submit("ownership-verification", {
              status: ownershipStatus,
              note: note.trim() || undefined,
            })
          }
        >
          Save ownership decision
        </Button>
      </section>
      {!listing.inspectionTask ? (
        <section className="space-y-3 border-t border-[var(--ink-100)] pt-4">
          <h3 className="font-semibold text-[var(--ink-900)]">
            Assign inspection
          </h3>
          <div className="space-y-2">
            <Label htmlFor="inspector-id">Inspector</Label>
            <Select
              id="inspector-id"
              value={inspectorId}
              onChange={(event) => setInspectorId(event.target.value)}
              disabled={inspectors.length === 0}
            >
              <option value="">Select an inspector</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.fullName} · {inspector.city}
                </option>
              ))}
            </Select>
            {inspectors.length === 0 ? (
              <p className="text-xs text-[var(--ink-500)]">
                No active inspector accounts are available.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspection-schedule">Scheduled at</Label>
            <Input
              id="inspection-schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            disabled={isPending || !inspectorId.trim() || !scheduledAt}
            onClick={() =>
              submit("inspection-tasks", {
                inspectorId: inspectorId.trim(),
                scheduledAt: new Date(scheduledAt).toISOString(),
                locationNote: note.trim() || undefined,
              })
            }
          >
            Assign inspector
          </Button>
        </section>
      ) : null}
      {listing.inspectionReport &&
      !listing.inspectionReport.buyerSummaryApproved ? (
        <section className="space-y-3 border-t border-[var(--ink-100)] pt-4">
          <h3 className="font-semibold text-[var(--ink-900)]">
            Buyer inspection summary
          </h3>
          <Button
            variant="amber"
            disabled={isPending}
            onClick={() =>
              submit("inspection-summary-approve", {
                buyerNote: note.trim() || undefined,
              })
            }
          >
            Approve buyer summary
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function defaultSchedule() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
