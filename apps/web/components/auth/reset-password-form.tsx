"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { isApiFailure, postJson } from "@/lib/web-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function readToken(location: Location) {
  const hashToken = new URLSearchParams(location.hash.replace(/^#/, "")).get("token");
  const queryToken = new URLSearchParams(location.search).get("token");
  return hashToken || queryToken;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readToken(window.location),
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (token) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [token]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!token) {
      setError({ message: "A reset token is required before the password can be changed." });
      return;
    }

    if (password !== confirmPassword) {
      setError({ message: "The password confirmation does not match." });
      return;
    }

    startTransition(async () => {
      const result = await postJson<void>("/api/auth/reset-password", {
        token,
        newPassword: password,
      });

      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      setNotice("Password updated. Redirecting you back to login.");
      window.setTimeout(() => {
        router.push("/auth/login?reset=1");
      }, 800);
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
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a new password"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--ink-700)]">
          <LockKeyhole className="h-4 w-4 text-[var(--amber-dark)]" />
          Security guidance
        </div>
        <p className="mt-2">
          Avoid reusing passwords from email or banking accounts. Password updates should
          feel like the end of the task, not the start of another one.
        </p>
      </div>
      <Button type="submit" variant="amber" className="w-full" disabled={isPending}>
        {isPending ? "Resetting..." : "Reset password"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
