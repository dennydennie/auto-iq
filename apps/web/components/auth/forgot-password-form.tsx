"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MailCheck } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { isApiFailure, postJson } from "@/lib/web-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    startTransition(async () => {
      const result = await postJson<void>("/api/auth/forgot-password", {
        email: trimmed,
      });

      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      // Success — swap into the "check your inbox" state so the user doesn't
      // spam-click Send.
      setSentTo(trimmed);
    });
  }

  // ─── Success state ──────────────────────────────────────────────────────
  if (sentTo) {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="display text-xl text-[var(--ink-900)]">Check your inbox</h2>
            <p className="text-sm leading-6 text-[var(--ink-700)]">
              If an account exists for <span className="font-mono">{sentTo}</span>, we&apos;ve
              sent a reset link. It expires in 30 minutes. Check spam if it doesn&apos;t
              arrive within a minute.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/login"
            className={buttonVariants({ variant: "amber", className: "flex-1 w-full" })}
          >
            Back to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setEmail("");
            }}
            className={buttonVariants({ variant: "outline", className: "flex-1 w-full" })}
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  // ─── Form state ─────────────────────────────────────────────────────────
  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="recovery-email">Account email</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          enterKeyHint="send"
          required
        />
      </div>

      <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--ink-700)]">
          <Mail className="h-4 w-4 text-[var(--amber-dark)]" aria-hidden="true" />
          What happens next
        </div>
        <p className="mt-2">
          If the account exists we&apos;ll send a reset link (valid for 30 minutes) and
          keep the response generic for security reasons.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="amber" className="flex-1" disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Link
          href="/auth/login"
          className={buttonVariants({ variant: "outline", className: "flex-1 w-full" })}
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
