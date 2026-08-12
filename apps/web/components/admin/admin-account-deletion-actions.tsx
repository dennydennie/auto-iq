"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminAccountDeletionRequestDto,
  ProcessAdminAccountDeletionRequest,
} from "@auto-iq/contracts/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson } from "@/lib/web-api";

export function AdminAccountDeletionActions({
  request,
}: {
  request: AdminAccountDeletionRequestDto;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] =
    useState<ProcessAdminAccountDeletionRequest["status"]>("COMPLETED");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [dataHandlingConfirmed, setDataHandlingConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const completing = status === "COMPLETED";
  const valid =
    note.trim().length >= 10 &&
    (!completing || (identityVerified && dataHandlingConfirmed));

  function processRequest() {
    startTransition(async () => {
      const result = await patchJson<AdminAccountDeletionRequestDto>(
        `/api/admin/account-deletion-requests/${request.id}`,
        {
          status,
          identityVerified,
          dataHandlingConfirmed,
          note: note.trim(),
        } satisfies ProcessAdminAccountDeletionRequest,
      );
      setConfirming(false);
      if (isApiFailure(result)) {
        toast({
          title: "Deletion request update failed",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      toast({
        title:
          result.data.status === "COMPLETED"
            ? "Deletion request completed"
            : "Deletion request cancelled",
        description: "The decision and operator evidence have been recorded.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 border-t border-[var(--ink-100)] pt-5">
      <div className="grid gap-2">
        <Label htmlFor={`deletion-status-${request.id}`}>Decision</Label>
        <Select
          id={`deletion-status-${request.id}`}
          value={status}
          onChange={(event) =>
            setStatus(
              event.target
                .value as ProcessAdminAccountDeletionRequest["status"],
            )
          }
        >
          <option value="COMPLETED">Complete after fulfilment</option>
          <option value="CANCELLED">Cancel request</option>
        </Select>
      </div>
      <Checkbox
        checked={identityVerified}
        onChange={(event) => setIdentityVerified(event.target.checked)}
        label="I verified that the requester controls this account."
      />
      <Checkbox
        checked={dataHandlingConfirmed}
        onChange={(event) => setDataHandlingConfirmed(event.target.checked)}
        label="I confirm required deletion or de-identification is complete and any retained records have a documented basis."
      />
      <div className="grid gap-2">
        <Label htmlFor={`deletion-note-${request.id}`}>
          Processing evidence
        </Label>
        <Textarea
          id={`deletion-note-${request.id}`}
          value={note}
          minLength={10}
          maxLength={1000}
          required
          placeholder="Record verification method, data handled, retention basis, or cancellation reason."
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant={completing ? "amber" : "outline"}
        disabled={!valid || isPending}
        onClick={() => setConfirming(true)}
      >
        {completing ? "Complete request" : "Cancel request"}
      </Button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={processRequest}
        title={
          completing
            ? "Confirm deletion fulfilment?"
            : "Cancel this deletion request?"
        }
        description={
          completing
            ? "This records that identity verification, deletion or de-identification, and the retention review are complete."
            : "This records that the deletion request will not be fulfilled. Include the reason in the processing evidence."
        }
        confirmLabel={completing ? "Record completion" : "Record cancellation"}
        busy={isPending}
      />
    </div>
  );
}
