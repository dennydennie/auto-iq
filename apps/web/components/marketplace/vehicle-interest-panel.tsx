"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, MessageSquareQuote, ShieldCheck } from "lucide-react";
import type { QuoteDto, CreateQuoteRequest } from "@auto-iq/contracts/quotes";
import type { ApprovedViewingLocationDto } from "@auto-iq/contracts/reference-data";
import type { RequestViewingRequest, ViewingDto } from "@auto-iq/contracts/viewings";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isApiFailure, postJson } from "@/lib/web-api";

type ViewerState = "anonymous" | "buyer" | "other";

type FeedbackState = {
  kind: "success";
  message: string;
} | {
  kind: "error";
  message: string;
  correlationId?: string;
} | null;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultLocationId(locations: ApprovedViewingLocationDto[]) {
  return locations[0]?.id ?? "";
}

export function VehicleInterestPanel({
  listingId,
  viewerState,
  viewingLocations,
}: {
  listingId: string;
  viewerState: ViewerState;
  viewingLocations: ApprovedViewingLocationDto[];
}) {
  const [quoteForm, setQuoteForm] = useState<CreateQuoteRequest>({
    offerPriceUsd: 0,
    paymentPlan: "FULL_CASH",
    message: "",
  });
  const [viewingForm, setViewingForm] = useState<RequestViewingRequest>({
    preferredDate: todayIso(),
    preferredTime: "11:00",
    locationId: defaultLocationId(viewingLocations),
    note: "",
  });
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const [openModal, setOpenModal] = useState<"quote" | "viewing" | null>(null);
  const canBookViewing = viewerState === "buyer" && viewingLocations.length > 0;

  function setQuoteField<K extends keyof CreateQuoteRequest>(key: K, value: CreateQuoteRequest[K]) {
    setQuoteForm((current) => ({ ...current, [key]: value }));
  }

  function setViewingField<K extends keyof RequestViewingRequest>(key: K, value: RequestViewingRequest[K]) {
    setViewingForm((current) => ({ ...current, [key]: value }));
  }

  function showError(message: string, correlationId?: string) {
    setFeedback({ kind: "error", message, correlationId });
    toast({ title: "Couldn't save", description: message, variant: "error" });
  }

  function showSuccess(message: string) {
    setFeedback({ kind: "success", message });
    toast({ title: "Saved", description: message, variant: "success" });
  }

  function handleQuoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await postJson<QuoteDto>(`/api/buyer/quotes/${listingId}`, {
        ...quoteForm,
        offerPriceUsd: Number(quoteForm.offerPriceUsd),
      });

      if (isApiFailure(result)) {
        showError(result.error.message, result.error.correlationId);
        return;
      }

      showSuccess(`Quote ${result.data.id} saved and sent for review.`);
      setOpenModal(null);
    });
  }

  function handleViewingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await postJson<ViewingDto>(`/api/buyer/viewings/${listingId}`, viewingForm);

      if (isApiFailure(result)) {
        showError(result.error.message, result.error.correlationId);
        return;
      }

      showSuccess(`Viewing request ${result.data.id} saved with status ${result.data.status}.`);
      setOpenModal(null);
    });
  }

  if (viewerState === "anonymous") {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--amber-dark)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="display text-2xl text-[var(--ink-900)]">Sign in to book or quote</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
              Buyer actions now hit the live API. Use a buyer account first, then come back here to save a quote or viewing request.
            </p>
          </div>
          <Link href="/auth/login" className={buttonVariants({ variant: "amber" })}>
            Go to buyer login
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (viewerState === "other") {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-3 p-6">
          <h2 className="display text-2xl text-[var(--ink-900)]">Buyer-only actions</h2>
          <p className="text-sm leading-6 text-[var(--ink-500)]">
            This listing detail is live, but quote and viewing flows are restricted to buyer accounts by the API contracts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Start a buyer action</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="amber"
            className="h-auto justify-start p-4 text-left"
            onClick={() => setOpenModal("quote")}
          >
            <MessageSquareQuote className="h-5 w-5" />
            <span>
              <span className="block font-semibold">Request a quote</span>
              <span className="mt-1 block text-xs font-normal opacity-75">
                Send an offer against this listing.
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start p-4 text-left"
            onClick={() => setOpenModal("viewing")}
          >
            <CalendarClock className="h-5 w-5" />
            <span>
              <span className="block font-semibold">Request a viewing</span>
              <span className="mt-1 block text-xs font-normal text-[var(--ink-500)]">
                Pick a BiSell-approved location.
              </span>
            </span>
          </Button>
        </CardContent>
      </Card>

      <ModalDialog
        open={openModal === "quote"}
        onClose={() => setOpenModal(null)}
        title="Request a quote"
        description="Saved against the live listing record and visible in your quote workspace."
      >
        <form className="space-y-4" onSubmit={handleQuoteSubmit}>
            <div className="space-y-2">
              <Label htmlFor="offerPriceUsd">Offer price (USD)</Label>
              <Input
                id="offerPriceUsd"
                type="number"
                min={1}
                value={quoteForm.offerPriceUsd || ""}
                onChange={(event) => setQuoteField("offerPriceUsd", Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentPlan">Payment plan</Label>
              <Select
                id="paymentPlan"
                value={quoteForm.paymentPlan}
                onChange={(event) => setQuoteField("paymentPlan", event.target.value as CreateQuoteRequest["paymentPlan"])}
              >
                <option value="FULL_CASH">Full cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteMessage">Message</Label>
              <Textarea
                id="quoteMessage"
                value={quoteForm.message}
                onChange={(event) => setQuoteField("message", event.target.value)}
                placeholder="Optional context for the seller or admin team"
              />
            </div>
            <Button type="submit" variant="amber" className="w-full" disabled={isPending}>
              {isPending ? "Saving quote..." : "Send quote"}
            </Button>
          </form>
      </ModalDialog>

      <ModalDialog
        open={openModal === "viewing"}
        onClose={() => setOpenModal(null)}
        title="Request a viewing"
        description="Viewing requests use BiSell-approved locations so the admin team can confirm safely."
      >
          {canBookViewing ? (
            <form className="space-y-4" onSubmit={handleViewingSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred date</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    min={todayIso()}
                    value={viewingForm.preferredDate}
                    onChange={(event) => setViewingField("preferredDate", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={viewingForm.preferredTime}
                    onChange={(event) => setViewingField("preferredTime", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationId">Approved location</Label>
                <Select
                  id="locationId"
                  value={viewingForm.locationId}
                  onChange={(event) => setViewingField("locationId", event.target.value)}
                >
                  {viewingLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} · {location.city}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="viewingNote">Note</Label>
                <Textarea
                  id="viewingNote"
                  value={viewingForm.note}
                  onChange={(event) => setViewingField("note", event.target.value)}
                  placeholder="Anything the admin team should know before confirming the slot"
                />
              </div>
              <Button type="submit" variant="amber" className="w-full" disabled={isPending}>
                {isPending ? "Saving viewing..." : "Request viewing"}
              </Button>
            </form>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/55 p-4 text-sm leading-6 text-[var(--ink-500)]">
              No approved viewing locations are currently available for booking.
            </div>
          )}
      </ModalDialog>

      {feedback ? feedback.kind === "error" ? (
        <ErrorBanner
          message={feedback.message}
          correlationId={feedback.correlationId}
        />
      ) : (
        <NoticeBanner className="lg:col-span-2" message={feedback.message} />
      ) : null}
    </div>
  );
}
