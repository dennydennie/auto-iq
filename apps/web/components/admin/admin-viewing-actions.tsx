"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CalendarClock, XCircle, ClipboardCheck } from "lucide-react";
import type {
  CancelViewingRequest,
  CompleteViewingRequest,
  ConfirmViewingRequest,
  RescheduleViewingRequest,
  ViewingDto,
} from "@auto-iq/contracts/viewings";
import type { ApprovedViewingLocationDto } from "@auto-iq/contracts/reference-data";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; correlationId?: string }
  | null;

function defaultConfirmedAt() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function AdminViewingActions({
  viewing,
  locations,
}: {
  viewing: ViewingDto;
  locations: ApprovedViewingLocationDto[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmedAt, setConfirmedAt] = useState(defaultConfirmedAt());
  const [locationId, setLocationId] = useState(viewing.location?.id ?? locations[0]?.id ?? "");
  const [noteToParticipants, setNoteToParticipants] = useState("");
  const [newSlot, setNewSlot] = useState(defaultConfirmedAt());
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState<CompleteViewingRequest["outcome"]>("COMPLETED");
  const [outcomeNote, setOutcomeNote] = useState("");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  function submit<TBody>(action: "confirm" | "reschedule" | "cancel" | "complete", body: TBody) {
    setFeedback(null);

    startTransition(async () => {
      const result = await postJson<ViewingDto>(`/api/admin/viewings/${viewing.id}/${action}`, body);
      if (isApiFailure(result)) {
        setFeedback({ kind: "error", message: result.error.message, correlationId: result.error.correlationId });
        toast({ title: "Couldn't update viewing", description: result.error.message, variant: "error" });
        return;
      }

      const successMessage = `Viewing ${viewing.id} updated to ${result.data.status}.`;
      setFeedback({ kind: "success", message: successMessage });
      toast({ title: "Viewing updated", description: successMessage, variant: "success" });
      router.refresh();
    });
  }

  const canConfirm = viewing.status === "REQUESTED" || viewing.status === "PENDING_SELLER_CONFIRMATION";
  const canReschedule = viewing.status !== "COMPLETED" && viewing.status !== "CANCELLED";
  const canCancel = viewing.status !== "COMPLETED" && viewing.status !== "CANCELLED";
  const canComplete = viewing.status === "CONFIRMED";

  return (
    <div className="space-y-5">
      {feedback ? feedback.kind === "error" ? (
        <ErrorBanner message={feedback.message} correlationId={feedback.correlationId} />
      ) : (
        <NoticeBanner message={feedback.message} />
      ) : null}

      {canConfirm ? (
        <div className="space-y-3 rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/60 p-4">
          <h3 className="display text-lg text-[var(--ink-900)]">Confirm slot</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-slot">Confirmed at</Label>
              <Input
                id="confirm-slot"
                type="datetime-local"
                value={confirmedAt}
                onChange={(event) => setConfirmedAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-location">Location</Label>
              <Select
                id="confirm-location"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.city}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-note">Note to participants (optional)</Label>
            <Textarea
              id="confirm-note"
              value={noteToParticipants}
              onChange={(event) => setNoteToParticipants(event.target.value)}
              placeholder="Anything the buyer or seller should know before arriving"
            />
          </div>
          <Button
            variant="amber"
            disabled={isPending || !locationId}
            onClick={() => {
              const body: ConfirmViewingRequest = {
                confirmedAt: new Date(confirmedAt).toISOString(),
                locationId,
                noteToParticipants: noteToParticipants.trim() || undefined,
              };
              submit("confirm", body);
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPending ? "Confirming..." : "Confirm viewing"}
          </Button>
        </div>
      ) : null}

      {canReschedule ? (
        <div className="space-y-3 rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/60 p-4">
          <h3 className="display text-lg text-[var(--ink-900)]">Reschedule</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reschedule-slot">New slot</Label>
              <Input
                id="reschedule-slot"
                type="datetime-local"
                value={newSlot}
                onChange={(event) => setNewSlot(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Reason</Label>
              <Input
                id="reschedule-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why is the slot changing?"
              />
            </div>
          </div>
          <Button
            variant="outline"
            disabled={isPending || reason.trim().length === 0}
            onClick={() => {
              const body: RescheduleViewingRequest = {
                newSlot: new Date(newSlot).toISOString(),
                reason: reason.trim(),
              };
              submit("reschedule", body);
            }}
          >
            <CalendarClock className="h-4 w-4" />
            {isPending ? "Saving..." : "Reschedule viewing"}
          </Button>
        </div>
      ) : null}

      {canComplete ? (
        <div className="space-y-3 rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/60 p-4">
          <h3 className="display text-lg text-[var(--ink-900)]">Mark complete</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="complete-outcome">Outcome</Label>
              <Select
                id="complete-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.target.value as CompleteViewingRequest["outcome"])}
              >
                <option value="COMPLETED">Completed</option>
                <option value="NO_SHOW">No show</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-note">Note (optional)</Label>
              <Input
                id="complete-note"
                value={outcomeNote}
                onChange={(event) => setOutcomeNote(event.target.value)}
                placeholder="Outcome note for the record"
              />
            </div>
          </div>
          <Button
            variant="amber"
            disabled={isPending}
            onClick={() => {
              const body: CompleteViewingRequest = {
                outcome,
                note: outcomeNote.trim() || undefined,
              };
              submit("complete", body);
            }}
          >
            <ClipboardCheck className="h-4 w-4" />
            {isPending ? "Saving..." : "Mark complete"}
          </Button>
        </div>
      ) : null}

      {canCancel ? (
        <div className="space-y-3 rounded-[1.25rem] border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.04)] p-4">
          <h3 className="display text-lg text-[var(--ink-900)]">Cancel viewing</h3>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Used for the audit trail and to notify participants"
            />
          </div>
          <Button
            variant="destructive"
            disabled={isPending || reason.trim().length === 0}
            onClick={() => setConfirmCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel viewing
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          setConfirmCancelOpen(false);
          const body: CancelViewingRequest = { reason: reason.trim() };
          submit("cancel", body);
        }}
        title="Cancel this viewing?"
        description="The buyer and seller are notified and the slot is released. This action is recorded with your reason."
        confirmLabel="Cancel viewing"
        variant="destructive"
        busy={isPending}
      />
    </div>
  );
}
