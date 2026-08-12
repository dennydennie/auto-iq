"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { AccountDeletionRequestResponse } from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isApiFailure, postJson } from "@/lib/web-api";

export function PublicAccountDeletionForm({ requested = false }) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [accepted, setAccepted] = useState(requested);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await postJson<AccountDeletionRequestResponse>(
        "/api/account-deletion-requests",
        {
          email: email.trim().toLowerCase(),
          reason: reason.trim() || undefined,
        },
      );
      if (isApiFailure(result)) {
        setError(result.error.message);
        return;
      }
      setAccepted(true);
      setError(null);
    });
  }

  if (accepted) {
    return (
      <div
        className="rounded-2xl bg-[var(--verified-soft)] p-5 text-sm leading-6 text-[var(--verified)]"
        role="status"
      >
        Your deletion request has been accepted. The AutoIQ team will verify
        account ownership before processing it.
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="space-y-2">
        <label htmlFor="deletion-email" className="text-sm font-semibold">
          Account email
        </label>
        <Input
          id="deletion-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="deletion-reason" className="text-sm font-semibold">
          Reason{" "}
          <span className="font-normal text-[var(--ink-500)]">(optional)</span>
        </label>
        <Textarea
          id="deletion-reason"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Sending…" : "Request account deletion"}
      </Button>
    </form>
  );
}
