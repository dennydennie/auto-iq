"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
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
}: {
  listingId: string;
  defaultDisclosure?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [disclosure, setDisclosure] = useState(defaultDisclosure ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function attemptSubmit() {
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
    <div className="space-y-3">
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
