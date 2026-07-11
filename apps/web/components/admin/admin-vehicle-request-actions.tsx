"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VehicleRequestStatus } from "@auto-iq/contracts/enums";
import type {
  UpdateVehicleRequestRequest,
  VehicleRequestDto,
} from "@auto-iq/contracts/vehicle-requests";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson } from "@/lib/web-api";

type AdminRequestStatus = Exclude<VehicleRequestStatus, "NEW">;

const STATUS_TRANSITIONS: Record<
  VehicleRequestStatus,
  readonly AdminRequestStatus[]
> = {
  NEW: ["ACKNOWLEDGED", "SOURCING", "MATCH_FOUND", "NO_MATCH", "CANCELLED"],
  ACKNOWLEDGED: ["SOURCING", "MATCH_FOUND", "NO_MATCH", "CANCELLED"],
  SOURCING: ["MATCH_FOUND", "NO_MATCH", "CANCELLED"],
  MATCH_FOUND: ["CANCELLED"],
  NO_MATCH: [],
  CANCELLED: [],
};

export function AdminVehicleRequestActions({
  request,
}: {
  request: VehicleRequestDto;
}) {
  const allowedStatuses = STATUS_TRANSITIONS[request.status];
  if (allowedStatuses.length === 0) {
    return null;
  }

  return (
    <VehicleRequestActionForm
      key={request.status}
      request={request}
      allowedStatuses={allowedStatuses}
    />
  );
}

function VehicleRequestActionForm({
  request,
  allowedStatuses,
}: {
  request: VehicleRequestDto;
  allowedStatuses: readonly AdminRequestStatus[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<AdminRequestStatus>(allowedStatuses[0]);
  const [adminNote, setAdminNote] = useState(request.adminNote ?? "");
  const [matchedListingId, setMatchedListingId] = useState(
    request.matchedListingId ?? "",
  );
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const body: UpdateVehicleRequestRequest = {
      status,
      adminNote: adminNote.trim() || undefined,
      matchedListingId:
        status === "MATCH_FOUND" ? matchedListingId.trim() : undefined,
    };
    startTransition(async () => {
      const result = await patchJson<VehicleRequestDto>(
        `/api/admin/vehicle-requests/${request.id}`,
        body,
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      setError(null);
      toast({
        title: "Request updated",
        description: "The sourcing queue is up to date.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 border-t border-[var(--ink-100)] pt-4">
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`request-status-${request.id}`}>Status</Label>
          <Select
            id={`request-status-${request.id}`}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdminRequestStatus)
            }
          >
            {allowedStatuses.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        {status === "MATCH_FOUND" ? (
          <div className="space-y-2">
            <Label htmlFor={`matched-listing-${request.id}`}>
              Published listing ID or slug
            </Label>
            <Input
              id={`matched-listing-${request.id}`}
              value={matchedListingId}
              onChange={(event) => setMatchedListingId(event.target.value)}
              required
            />
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`admin-note-${request.id}`}>Admin note</Label>
        <Textarea
          id={`admin-note-${request.id}`}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </div>
      <Button
        variant="amber"
        onClick={submit}
        disabled={
          isPending || (status === "MATCH_FOUND" && !matchedListingId.trim())
        }
      >
        {isPending ? "Saving..." : "Update request"}
      </Button>
    </div>
  );
}
