"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, RefreshCcw } from "lucide-react";
import type {
  MeResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { getJson, isApiFailure, postJson } from "@/lib/web-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function sendPayload(identifier: string): SendOtpRequest {
  return { identifier };
}

function verifyPayload(identifier: string, code: string): VerifyOtpRequest {
  return { identifier, code };
}

export function OtpForm({
  identifier,
  autoSend = false,
}: {
  identifier: string | null;
  autoSend?: boolean;
}) {
  const [code, setCode] = useState("");
  // Live countdown mirrors backend TTL. Ticks down every second so users see
  // the code approach expiry — critical on mobile where SMS delivery can
  // stall.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
    code?: string;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verificationLocked, setVerificationLocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const autoSentIdentifier = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCodeReady = code.length === CODE_LENGTH;

  function applyOtpMeta(payload: SendOtpResponse) {
    setSecondsRemaining(payload.expiresIn);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setAttemptsRemaining(payload.attemptsRemaining);
  }

  const requestOtp = useCallback((accountIdentifier: string) => {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await postJson<SendOtpResponse>(
        "/api/auth/otp/send",
        sendPayload(accountIdentifier),
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      applyOtpMeta(result.data);
      setVerificationLocked(false);
      setNotice("A fresh verification code has been sent.");
    });
  }, []);

  function sendOtp() {
    if (!identifier) {
      setError({
        message:
          "An email or phone number is required before an OTP can be sent.",
      });
      return;
    }
    if (resendCooldown > 0) return;
    requestOtp(identifier);
  }

  function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier) {
      setError({
        message:
          "An email or phone number is required before verification can continue.",
      });
      return;
    }

    if (!isCodeReady) {
      setError({
        message: `Enter the ${CODE_LENGTH}-digit code from your SMS.`,
      });
      return;
    }

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await postJson<VerifyOtpResponse>(
        "/api/auth/otp/verify",
        verifyPayload(identifier, code.trim()),
      );

      if (isApiFailure(result)) {
        if (result.error.code === "OTP_MAX_ATTEMPTS") {
          setCode("");
          setSecondsRemaining(0);
          setResendCooldown(0);
          setVerificationLocked(true);
        }
        setError(result.error);
        return;
      }

      const profile = await getJson<MeResponse>("/api/me");
      const destination =
        profile.ok && profile.data.roles.includes("SELLER") ? "/seller" : "/";
      window.location.assign(destination);
    });
  }

  // Auto-send on first visit if we already have the identifier.
  useEffect(() => {
    if (!autoSend || !identifier || autoSentIdentifier.current === identifier)
      return;
    autoSentIdentifier.current = identifier;
    requestOtp(identifier);
  }, [autoSend, identifier, requestOtp]);

  // Focus the code input on mount so mobile keyboards open immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown ticker — one interval drives both TTL and resend cooldown.
  useEffect(() => {
    if (secondsRemaining === null && resendCooldown === 0) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current === null || current <= 0) return current;
        return current - 1;
      });
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [secondsRemaining, resendCooldown]);

  const codeExpired = secondsRemaining !== null && secondsRemaining <= 0;

  return (
    <form className="space-y-6" onSubmit={verifyOtp}>
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}

      {notice ? <NoticeBanner message={notice} /> : null}

      <div className="space-y-2">
        <Label htmlFor="otp-code">Verification code</Label>
        <Input
          ref={inputRef}
          id="otp-code"
          name="code"
          type="text"
          inputMode="numeric"
          // one-time-code is the iOS / Android SMS auto-fill hint. This is
          // what pulls the code out of the SMS notification banner on iOS 12+
          // and Android's Autofill service.
          autoComplete="one-time-code"
          autoFocus
          pattern="\d{6}"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
          }
          placeholder="123456"
          aria-invalid={Boolean(error)}
          aria-describedby="otp-help"
          className="h-14 text-center font-mono text-2xl tracking-[0.35em]"
          required
          disabled={verificationLocked}
        />
        <p id="otp-help" className="text-xs text-[var(--ink-400)]">
          6-digit code sent by SMS. Your device may fill it in automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="space-y-1 text-sm text-[var(--ink-500)]"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <Clock3
              className="h-4 w-4 text-[var(--amber-dark)]"
              aria-hidden="true"
            />
            {secondsRemaining === null
              ? "Tap resend to send a fresh code"
              : codeExpired
                ? "Code expired — request a new one"
                : `Code expires in ${secondsRemaining}s`}
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
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[var(--amber-dark)] transition hover:bg-[var(--amber-soft)]/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending || resendCooldown > 0}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          variant="amber"
          className="flex-1"
          disabled={isPending || !isCodeReady || verificationLocked}
        >
          {isPending ? "Verifying..." : "Verify code"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Link
          href="/auth/login"
          className={buttonVariants({
            variant: "outline",
            className: "flex-1 w-full",
          })}
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
