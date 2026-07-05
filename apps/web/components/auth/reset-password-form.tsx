"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { PasswordField, assessPassword } from "@/components/auth/password-field";
import { isApiFailure, postJson } from "@/lib/web-api";
import { Button } from "@/components/ui/button";

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

  // Scrub token from the URL as soon as we've read it into React state — the
  // reset link is single-use, and leaving it in the URL means it can leak via
  // Referer / analytics / browser history.
  useEffect(() => {
    if (!token) return;
    window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  const strength = assessPassword(password);
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const disableSubmit = useMemo(() => {
    if (isPending) return true;
    if (!token) return true;
    if (strength === "weak" || strength === "empty") return true;
    if (passwordsMismatch || confirmPassword.length === 0) return true;
    return false;
  }, [isPending, token, strength, passwordsMismatch, confirmPassword.length]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!token) {
      setError({
        message:
          "This reset link is missing its token. Open the link from your reset email again, or request a new one.",
      });
      return;
    }

    if (strength === "weak") {
      setError({
        message: "Choose a password with at least 8 characters and a mix of letters and numbers.",
      });
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

      setNotice("Password updated. Redirecting you to sign-in…");
      // Give screen readers and the notice-banner enough time to be read.
      window.setTimeout(() => {
        router.push("/auth/login?reset=1");
      }, 1500);
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      {notice ? <NoticeBanner message={notice} /> : null}

      <PasswordField
        id="new-password"
        name="newPassword"
        label="New password"
        value={password}
        onChange={setPassword}
        placeholder="Create a new password"
        showStrength
        invalid={Boolean(error) && strength === "weak"}
      />

      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Repeat your new password"
        requirementHint={
          passwordsMismatch
            ? "Passwords don't match yet."
            : confirmPassword.length > 0
              ? "Matches — you're good to go."
              : "Retype the password above to confirm."
        }
        invalid={passwordsMismatch}
      />

      <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
        <div className="flex items-center gap-2 font-semibold text-[var(--ink-700)]">
          <LockKeyhole className="h-4 w-4 text-[var(--amber-dark)]" aria-hidden="true" />
          Security guidance
        </div>
        <p className="mt-2">
          Avoid reusing passwords from email or banking accounts. This reset link is
          single-use — after a successful reset the link is invalidated immediately.
        </p>
      </div>

      <Button
        type="submit"
        variant="amber"
        className="w-full"
        disabled={disableSubmit}
      >
        {isPending ? "Resetting..." : "Reset password"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
