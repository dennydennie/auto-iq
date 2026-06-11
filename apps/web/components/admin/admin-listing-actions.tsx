"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@auto-iq/contracts/enums";
import type { AdminListingDto } from "@auto-iq/contracts/admin";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isApiFailure, postJson } from "@/lib/web-api";

type FeedbackState = {
  kind: "success";
  message: string;
} | {
  kind: "error";
  message: string;
  correlationId?: string;
} | null;

function canApprove(status: ListingStatus) {
  return status === "SUBMITTED" || status === "CHANGES_REQUESTED";
}

function canPublish(status: ListingStatus) {
  return status === "APPROVED";
}

function canModerate(status: ListingStatus) {
  return !["DELISTED", "PUBLISHED", "REJECTED", "SOLD"].includes(status);
}

export function AdminListingActions({
  listingId,
  status,
}: { listingId: string; status: AdminListingDto["status"] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: string, body?: Record<string, string>) {
    setFeedback(null);

    startTransition(async () => {
      const result = await postJson<AdminListingDto>(`/api/admin/listings/${listingId}/${action}`, body);

      if (isApiFailure(result)) {
        setFeedback({
          kind: "error",
          message: result.error.message,
          correlationId: result.error.correlationId,
        });
        return;
      }

      setFeedback({
        kind: "success",
        message: `${result.data.specs.year} ${result.data.specs.make} ${result.data.specs.model} updated to ${result.data.status}.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {feedback ? feedback.kind === "error" ? (
        <ErrorBanner message={feedback.message} correlationId={feedback.correlationId} />
      ) : (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="moderation-note">Moderation note</Label>
        <Textarea
          id="moderation-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Used for request changes or rejection reasons"
        />
      </div>

      <div className="grid gap-3">
        {canApprove(status) ? (
          <Button
            variant="amber"
            disabled={isPending}
            onClick={() => submit("approve")}
          >
            {isPending ? "Updating..." : "Approve listing"}
          </Button>
        ) : null}

        {canPublish(status) ? (
          <Button
            variant="amber"
            disabled={isPending}
            onClick={() => submit("publish")}
          >
            {isPending ? "Updating..." : "Publish listing"}
          </Button>
        ) : null}

        {canModerate(status) ? (
          <Button
            variant="outline"
            disabled={isPending || note.trim().length === 0}
            onClick={() => submit("request-changes", { message: note.trim() })}
          >
            Request changes
          </Button>
        ) : null}

        {canModerate(status) ? (
          <Button
            variant="destructive"
            disabled={isPending || note.trim().length === 0}
            onClick={() => submit("reject", { reason: note.trim() })}
          >
            Reject listing
          </Button>
        ) : null}
      </div>
    </div>
  );
}
