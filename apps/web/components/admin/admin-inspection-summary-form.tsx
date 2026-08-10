"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InspectionReportDto } from "@auto-iq/contracts/inspections";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

export function AdminInspectionSummaryForm({
  listingId,
  report,
}: {
  listingId: string;
  report: InspectionReportDto;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [buyerNote, setBuyerNote] = useState(report.inspectorNote);
  const [includedIds, setIncludedIds] = useState(
    () => new Set(report.findings.map((finding) => finding.id)),
  );
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleFinding(id: string, included: boolean) {
    setIncludedIds((current) => {
      const next = new Set(current);
      if (included) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await postJson(
        `/api/admin/listings/${listingId}/inspection-summary-approve`,
        {
          buyerNote: buyerNote.trim() || undefined,
          includedFindingIds: [...includedIds],
        },
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      toast({
        title: "Buyer summary approved",
        description: "Only the selected findings will be visible to buyers.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink-500)]">
          Choose the findings that are safe and useful for buyers.
        </p>
        {report.findings.map((finding) => (
          <Checkbox
            key={finding.id}
            checked={includedIds.has(finding.id)}
            onChange={(event) => toggleFinding(finding.id, event.target.checked)}
            label={`${labelizeEnum(finding.category)} · ${finding.label} · ${labelizeEnum(finding.rating)}`}
          />
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-inspection-note">Buyer-facing summary</Label>
        <Textarea
          id="buyer-inspection-note"
          value={buyerNote}
          onChange={(event) => setBuyerNote(event.target.value)}
          maxLength={2000}
        />
      </div>
      <Button
        variant="amber"
        disabled={isPending || includedIds.size === 0}
        onClick={approve}
      >
        {isPending ? "Approving..." : "Approve buyer summary"}
      </Button>
    </div>
  );
}
