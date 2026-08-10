"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@auto-iq/contracts/enums";
import type { AdminListingDto } from "@auto-iq/contracts/admin";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import {
  adminApprovalReady,
  approvalBlockers,
  canApproveStatus,
} from "@/lib/admin-listing-workflow";
import { isApiFailure, postJson } from "@/lib/web-api";

type FeedbackState =
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
      correlationId?: string;
    }
  | null;

function canPublish(status: ListingStatus) {
  return status === "APPROVED";
}

function canRequestChanges(status: ListingStatus) {
  return [
    "SUBMITTED",
    "INSPECTION_PENDING",
    "OWNERSHIP_VERIFICATION_PENDING",
    "APPROVED",
  ].includes(status);
}

function canReject(status: ListingStatus) {
  return [
    "SUBMITTED",
    "INSPECTION_PENDING",
    "OWNERSHIP_VERIFICATION_PENDING",
    "CHANGES_REQUESTED",
  ].includes(status);
}

function canCloseListing(status: ListingStatus) {
  return status === "PUBLISHED" || status === "RESERVED";
}

export function AdminListingActions({ listing }: { listing: AdminListingDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const approvalReady = adminApprovalReady(listing);
  const blockers = approvalBlockers(listing);
  const { id: listingId, status } = listing;

  function submit(action: string, body?: Record<string, string>) {
    setFeedback(null);

    startTransition(async () => {
      const result = await postJson<AdminListingDto>(
        `/api/admin/listings/${listingId}/${action}`,
        body,
      );

      if (isApiFailure(result)) {
        setFeedback({
          kind: "error",
          message: result.error.message,
          correlationId: result.error.correlationId,
        });
        toast({
          title: "Action failed",
          description: result.error.message,
          variant: "error",
        });
        return;
      }

      const successMessage = "Listing workflow updated successfully.";
      setFeedback({ kind: "success", message: successMessage });
      toast({
        title: "Listing updated",
        description: successMessage,
        variant: "success",
      });
      router.refresh();
    });
  }

  function confirmReject() {
    setConfirmRejectOpen(false);
    submit("reject", { reason: note.trim() });
  }

  function confirmPublish() {
    setConfirmPublishOpen(false);
    submit("publish");
  }

  return (
    <div className="space-y-4">
      {feedback ? (
        feedback.kind === "error" ? (
          <ErrorBanner
            message={feedback.message}
            correlationId={feedback.correlationId}
          />
        ) : (
          <NoticeBanner message={feedback.message} />
        )
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
        {canApproveStatus(status) ? (
          <>
            <Button
              variant="amber"
              disabled={isPending || !approvalReady}
              onClick={() => submit("approve")}
            >
              {isPending ? "Updating..." : "Approve listing"}
            </Button>
            {!approvalReady ? (
              <p className="text-xs leading-5 text-[var(--ink-500)]">
                Approval is locked until: {blockers.join(", ")}.
              </p>
            ) : null}
          </>
        ) : null}

        {canPublish(status) ? (
          <Button
            variant="amber"
            disabled={isPending || !approvalReady}
            onClick={() => setConfirmPublishOpen(true)}
          >
            {isPending ? "Updating..." : "Publish listing"}
          </Button>
        ) : null}

        {status === "PUBLISHED" ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => submit("mark-reserved")}
          >
            Mark reserved
          </Button>
        ) : null}

        {canCloseListing(status) ? (
          <Button
            variant="amber"
            disabled={isPending}
            onClick={() => submit("mark-sold")}
          >
            Mark sold
          </Button>
        ) : null}

        {canCloseListing(status) ? (
          <Button
            variant="destructive"
            disabled={isPending || note.trim().length === 0}
            onClick={() => submit("delist", { reason: note.trim() })}
          >
            Delist vehicle
          </Button>
        ) : null}

        {canRequestChanges(status) ? (
          <Button
            variant="outline"
            disabled={isPending || note.trim().length === 0}
            onClick={() => submit("request-changes", { message: note.trim() })}
          >
            Request changes
          </Button>
        ) : null}

        {canReject(status) ? (
          <Button
            variant="destructive"
            disabled={isPending || note.trim().length === 0}
            onClick={() => setConfirmRejectOpen(true)}
          >
            Reject listing
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={confirmPublish}
        title="Publish this listing?"
        description="Publishing makes the vehicle and approved buyer inspection summary visible in the public marketplace."
        confirmLabel="Publish listing"
        variant="default"
        busy={isPending}
      />

      <ConfirmDialog
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={confirmReject}
        title="Reject this listing?"
        description="The seller will be notified and the listing cannot be published without re-submission. This action is recorded with your moderation note."
        confirmLabel="Reject listing"
        variant="destructive"
        busy={isPending}
      />
    </div>
  );
}
