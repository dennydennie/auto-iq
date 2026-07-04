"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Send } from "lucide-react";
import type { SellerListingDto, SubmitListingRequest } from "@auto-iq/contracts/listings";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

/**
 * Sends the listing to admin review. Requires final seller disclosure text.
 * Only valid for DRAFT and CHANGES_REQUESTED listings.
 */
export function SubmitListingAction({
  listingId,
  defaultDisclosure,
  requirements = [],
}: {
  listingId: string;
  defaultDisclosure?: string | null;
  requirements?: Array<{ label: string; complete: boolean }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [disclosure, setDisclosure] = useState(defaultDisclosure ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const missingRequirements = requirements.filter((item) => !item.complete);

  function requirementError() {
    if (missingRequirements.length === 0) return "";
    return `Complete before submission: ${missingRequirements.map((item) => item.label).join(", ")}.`;
  }

  function attemptSubmit() {
    const missing = requirementError();
    if (missing) {
      setError(missing);
      return;
    }

    if (disclosure.trim().length < 20) {
      setError("Add a short seller disclosure (at least 20 characters) so buyers can trust the listing.");
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  function submit() {
    setConfirmOpen(false);
    startTransition(async () => {
      const body: SubmitListingRequest = { sellerDisclosure: disclosure.trim() };
      const result = await postJson<SellerListingDto>(
        `/api/seller/listings/${listingId}/submit`,
        body,
      );

      if (isApiFailure(result)) {
        const details = result.error.details?.map((detail) => detail.message).join(", ");
        const message = details ? `${result.error.message}: ${details}` : result.error.message;
        setError(message);
        toast({
          title: "Couldn't submit for review",
          description: message,
          variant: "error",
        });
        return;
      }

      toast({
        title: "Submitted for review",
        description: "The admin team has been notified. You'll see status updates here.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {requirements.length > 0 ? (
        <div className="rounded-[1.15rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-400)]">
            Submission checklist
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {requirements.map((item) => (
              <li
                key={item.label}
                className={item.complete ? "flex items-center gap-2 text-[var(--verified)]" : "flex items-center gap-2 text-[var(--ink-500)]"}
              >
                {item.complete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 text-[var(--amber-dark)]" />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="seller-disclosure">Seller disclosure</Label>
        <Textarea
          id="seller-disclosure"
          value={disclosure}
          onChange={(event) => {
            setDisclosure(event.target.value);
            setError(null);
          }}
          placeholder="Anything a buyer should know — service history, known faults, why you're selling"
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p className="text-xs font-medium text-[var(--reject)]">{error}</p>
        ) : (
          <p className="text-xs text-[var(--ink-400)]">
            Public on the buyer detail page. Keep it accurate — admin can request changes.
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="amber"
        onClick={attemptSubmit}
        disabled={isPending}
        className="w-full justify-center"
      >
        <Send className="h-4 w-4" />
        {isPending ? "Submitting..." : "Submit for review"}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Submit this listing for review?"
        description="Once submitted, you can't edit the listing until admin either approves it or requests changes. Make sure your details are correct."
        confirmLabel="Submit for review"
        variant="default"
        busy={isPending}
      />
    </div>
  );
}
