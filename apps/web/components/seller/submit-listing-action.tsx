"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Send } from "lucide-react";
import type { SellerListingDto, SubmitListingRequest } from "@auto-iq/contracts/listings";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { isApiFailure, postJson } from "@/lib/web-api";

// Minimum bar before the submit button unlocks. The API also enforces these
// (kept in sync deliberately so the button never fires a doomed request).
const MIN_DISCLOSURE_LENGTH = 20;
const MIN_PHOTOS = 3;
const MIN_DOCUMENTS = 1;

type ChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  /** Optional helper copy explaining what's missing. */
  hint?: string;
};

function buildChecklist(listing: SellerListingDto, disclosure: string): ChecklistItem[] {
  const specs = listing.specs;
  const pricing = listing.pricing;
  const basicsComplete = Boolean(
    specs.make &&
      specs.model &&
      specs.year &&
      specs.colour &&
      Number.isFinite(specs.mileageKm) &&
      Number.isFinite(pricing.askPriceUsd) &&
      pricing.askPriceUsd > 0,
  );

  const photoCount = listing.images.length;
  const hasCover = listing.images.some((image) => image.isCover);
  const documentCount = listing.documents.length;
  const disclosureOk = disclosure.trim().length >= MIN_DISCLOSURE_LENGTH;

  return [
    {
      id: "basics",
      label: "Vehicle basics filled in",
      complete: basicsComplete,
      hint: basicsComplete
        ? undefined
        : "Make, model, year, colour, mileage, and asking price.",
    },
    {
      id: "photos",
      label: `${MIN_PHOTOS}+ photos uploaded`,
      complete: photoCount >= MIN_PHOTOS,
      hint: photoCount >= MIN_PHOTOS
        ? undefined
        : `You've uploaded ${photoCount} of ${MIN_PHOTOS}. Front three-quarter, driver side, and interior are the priority shots.`,
    },
    {
      id: "cover",
      label: "Cover photo selected",
      complete: hasCover,
      hint: hasCover ? undefined : "Upload a front three-quarter photo — it becomes the cover automatically.",
    },
    {
      id: "documents",
      label: `${MIN_DOCUMENTS}+ ownership document uploaded`,
      complete: documentCount >= MIN_DOCUMENTS,
      hint: documentCount >= MIN_DOCUMENTS
        ? undefined
        : "At least one ownership document is required for admin verification.",
    },
    {
      id: "disclosure",
      label: "Seller disclosure written",
      complete: disclosureOk,
      hint: disclosureOk
        ? undefined
        : `Add at least ${MIN_DISCLOSURE_LENGTH} characters covering service history or known issues.`,
    },
  ];
}

/**
 * Sends the listing to admin review. Gated on a checklist so sellers never
 * submit an incomplete listing that admin will bounce back.
 * Only valid for DRAFT and CHANGES_REQUESTED listings.
 */
export function SubmitListingAction({
  listing,
}: {
  listing: SellerListingDto;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [disclosure, setDisclosure] = useState(listing.sellerDisclosure ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const checklist = useMemo(() => buildChecklist(listing, disclosure), [listing, disclosure]);
  const allComplete = checklist.every((item) => item.complete);
  const completeCount = checklist.filter((item) => item.complete).length;

  function attemptSubmit() {
    if (!allComplete) {
      setError("Finish every checklist item before submitting.");
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
        `/api/seller/listings/${listing.id}/submit`,
        body,
      );

      if (isApiFailure(result)) {
        setError(result.error.message);
        toast({
          title: "Couldn't submit for review",
          description: result.error.message,
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
    <div className="space-y-4">
      {/* Checklist */}
      <div className="rounded-2xl border border-[var(--ink-100)] bg-[var(--ink-50)]/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-400)]">
            Ready to submit?
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              allComplete
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[var(--ink-100)] text-[var(--ink-700)]",
            )}
          >
            {completeCount} / {checklist.length}
          </span>
        </div>
        <ul className="space-y-2">
          {checklist.map((item) => {
            const Icon = item.complete ? CheckCircle2 : Circle;
            return (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    item.complete ? "text-emerald-600" : "text-[var(--ink-300)]",
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className={cn(item.complete ? "text-[var(--ink-700)]" : "text-[var(--ink-900)]")}>
                    {item.label}
                  </p>
                  {!item.complete && item.hint ? (
                    <p className="text-xs leading-5 text-[var(--ink-400)]">{item.hint}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Disclosure input */}
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
        disabled={isPending || !allComplete}
        className="w-full justify-center"
        aria-describedby="submit-cta-help"
      >
        <Send className="h-4 w-4" />
        {isPending ? "Submitting..." : allComplete ? "Submit for review" : "Complete checklist to submit"}
      </Button>
      {!allComplete ? (
        <p id="submit-cta-help" className="text-center text-xs text-[var(--ink-400)]">
          Finish every item above to unlock submit.
        </p>
      ) : null}

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
