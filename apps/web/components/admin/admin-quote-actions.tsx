"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuoteDto, UpdateQuoteRequest } from "@auto-iq/contracts/quotes";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

const ACTION_BY_STATUS: Record<UpdateQuoteRequest["status"], string> = {
  UNDER_REVIEW: "review",
  ACCEPTED: "accept",
  COUNTERED: "counter",
  DECLINED: "decline",
};

export function AdminQuoteActions({ quote }: { quote: QuoteDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<UpdateQuoteRequest["status"]>(
    quote.status === "COUNTERED" ? "ACCEPTED" : "UNDER_REVIEW",
  );
  const [counterPrice, setCounterPrice] = useState("");
  const [responseNote, setResponseNote] = useState("");
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await postJson<QuoteDto>(
        `/api/admin/quotes/${quote.id}/${ACTION_BY_STATUS[status]}`,
        {
          counterPriceUsd:
            status === "COUNTERED" ? Number(counterPrice) : undefined,
          responseNote: responseNote.trim() || undefined,
        },
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      toast({
        title: "Quote updated",
        description: "The buyer can now see your response.",
        variant: "success",
      });
      router.refresh();
    });
  }

  if (!["NEW", "UNDER_REVIEW", "COUNTERED"].includes(quote.status)) return null;

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
          <Label htmlFor={`quote-status-${quote.id}`}>Response</Label>
          <Select
            id={`quote-status-${quote.id}`}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as UpdateQuoteRequest["status"])
            }
          >
            {quote.status !== "COUNTERED" ? (
              <option value="UNDER_REVIEW">Under review</option>
            ) : null}
            <option value="ACCEPTED">Accept</option>
            <option value="COUNTERED">Counter</option>
            <option value="DECLINED">Decline</option>
          </Select>
        </div>
        {status === "COUNTERED" ? (
          <div className="space-y-2">
            <Label htmlFor={`counter-price-${quote.id}`}>
              Counter price (USD)
            </Label>
            <Input
              id={`counter-price-${quote.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={counterPrice}
              onChange={(event) => setCounterPrice(event.target.value)}
              required
            />
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`quote-note-${quote.id}`}>Response note</Label>
        <Textarea
          id={`quote-note-${quote.id}`}
          value={responseNote}
          onChange={(event) => setResponseNote(event.target.value)}
          placeholder="Optional context for the buyer"
        />
      </div>
      <Button
        variant="amber"
        disabled={
          isPending || (status === "COUNTERED" && Number(counterPrice) <= 0)
        }
        onClick={submit}
      >
        {isPending ? "Saving..." : "Save response"}
      </Button>
    </div>
  );
}
