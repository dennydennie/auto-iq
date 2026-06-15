"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";

import { isApiFailure, postJson } from "@/lib/web-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await postJson<void>("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      setNotice(
        "If an account exists for that email address, reset instructions have been sent.",
      );
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      {notice ? (
        <NoticeBanner message={notice} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="recovery-email">Account email</Label>
        <Input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--ink-700)]">
          <Mail className="h-4 w-4 text-[var(--amber-dark)]" />
          What happens next
        </div>
        <p className="mt-2">
          If the account exists, we’ll send a reset link and keep the response generic for
          security reasons.
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
