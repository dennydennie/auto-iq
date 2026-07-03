"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, RefreshCcw } from "lucide-react";
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { isApiFailure, postJson } from "@/lib/web-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function loginHref(identifier: string) {
  const params = new URLSearchParams({ verified: "1", identifier });
  return `/auth/login?${params.toString()}`;
}

function sendPayload(identifier: string, phone: string | null): SendOtpRequest {
  return phone ? { identifier, phone } : { identifier };
}

function verifyPayload(identifier: string, phone: string | null, code: string): VerifyOtpRequest {
  return phone ? { identifier, phone, code } : { identifier, code };
}

export function OtpForm({
  identifier,
  phone,
  autoSend = false,
}: {
  identifier: string | null;
  phone: string | null;
  autoSend?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoSentIdentifier = useRef<string | null>(null);

  function applyOtpMeta(payload: SendOtpResponse) {
    setExpiresIn(payload.expiresIn);
    setAttemptsRemaining(payload.attemptsRemaining);
  }

  const requestOtp = useCallback((accountIdentifier: string) => {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await postJson<SendOtpResponse>(
        "/api/auth/otp/send",
        sendPayload(accountIdentifier, phone),
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      applyOtpMeta(result.data);
      setNotice("A fresh verification code has been sent.");
    });
  }, [phone]);

  function sendOtp() {
    if (!identifier) {
      setError({ message: "An email or phone number is required before an OTP can be sent." });
      return;
    }

    requestOtp(identifier);
  }

  function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier) {
      setError({ message: "An email or phone number is required before verification can continue." });
      return;
    }

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await postJson<VerifyOtpResponse>(
        "/api/auth/otp/verify",
        verifyPayload(identifier, phone, code.trim()),
      );

      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      router.push(loginHref(identifier));
    });
  }

  useEffect(() => {
    if (!autoSend || !identifier || autoSentIdentifier.current === identifier) {
      return;
    }

    autoSentIdentifier.current = identifier;
    const timer = window.setTimeout(() => {
      requestOtp(identifier);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoSend, identifier, requestOtp]);

  return (
    <form className="space-y-6" onSubmit={verifyOtp}>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      {notice ? (
        <NoticeBanner message={notice} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="otp-code">Verification code</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter the 6-digit code"
          aria-invalid={Boolean(error)}
          required
        />
      </div>

      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-[var(--ink-500)]">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--amber-dark)]" />
            {expiresIn ? `Code expires in ${expiresIn}s` : "Request a code to start verification"}
          </div>
          {attemptsRemaining !== null ? (
            <div className="text-xs text-[var(--ink-400)]">
              Attempts remaining: {attemptsRemaining}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={sendOtp}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--amber-dark)]"
          disabled={isPending}
        >
          <RefreshCcw className="h-4 w-4" />
          Resend code
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="amber" className="flex-1" disabled={isPending}>
          {isPending ? "Verifying..." : "Verify code"}
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
