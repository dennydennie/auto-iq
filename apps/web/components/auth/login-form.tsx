"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import type { ApiError } from "@auto-iq/contracts/error";
import type { LoginRequest, LoginResponse } from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";

import { isApiFailure, postJson } from "@/lib/web-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_ROLES = new Set(["ADMIN", "PARTNER_ADMIN", "SYSTEM_ADMINISTRATOR"]);

function destinationFor(role: LoginResponse["role"], mode: "user" | "admin") {
  if (mode === "admin") {
    return "/admin";
  }

  if (ADMIN_ROLES.has(role)) {
    return "/admin";
  }

  if (role === "SELLER") {
    return "/seller";
  }

  return "/";
}

function validateAdmin(role: LoginResponse["role"]) {
  return ADMIN_ROLES.has(role);
}

export function LoginForm({
  mode = "user",
  defaultIdentifier = "",
  nextHref,
}: {
  mode?: "user" | "admin";
  /** Pre-fill the identifier field (used after email verification, password reset). */
  defaultIdentifier?: string;
  /** Optional same-origin redirect target after successful login. */
  nextHref?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({
    identifier: defaultIdentifier,
    password: "",
  });
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
    code?: string;
    details?: ApiError["details"];
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof LoginRequest>(key: K, value: LoginRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await postJson<LoginResponse>("/api/auth/login", form);
      if (isApiFailure(result)) {
        if (result.error.code === "OTP_REQUIRED") {
          const phone = otpPhone(result.error, form.identifier);
          const params = new URLSearchParams({
            identifier: form.identifier.trim(),
            registered: "0",
          });
          if (phone) {
            params.set("phone", phone);
          }
          router.push(`/auth/otp?${params.toString()}`);
          return;
        }

        setError(result.error);
        return;
      }

      if (mode === "admin" && !validateAdmin(result.data.role)) {
        setError({ message: "This account does not have admin console access." });
        return;
      }

      const destination = nextHref ?? destinationFor(result.data.role, mode);
      // Hard reload so RSC caches for the authenticated view are cleared.
      // router.push + refresh() alone doesn't consistently repopulate the
      // marketplace layout's `signedIn` state fast enough.
      window.location.assign(destination);
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      <div className="space-y-3">
        <Label htmlFor={`${mode}-identifier`}>Email or phone</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
          <Input
            id={`${mode}-identifier`}
            name="identifier"
            type="email"
            // Mobile keyboards react to inputMode. Email variant lets iOS/Android
            // offer @ and . without switching. Users who paste a phone (+263…)
            // still work because the API accepts either.
            inputMode="email"
            value={form.identifier}
            onChange={(event) => setField("identifier", event.target.value)}
            placeholder="you@example.com or +263..."
            autoComplete="username webauthn"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            enterKeyHint="next"
            className="h-12 rounded-2xl border-[var(--ink-300)] bg-[var(--ink-50)]/55 pl-11"
            required
          />
        </div>
        <p className="text-xs leading-5 text-[var(--ink-400)]">
          Use the email or Zimbabwe mobile number already tied to your account.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-[var(--amber-dark)]"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
          <Input
            id={`${mode}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password webauthn"
            aria-invalid={Boolean(error)}
            enterKeyHint="go"
            className="h-12 rounded-2xl border-[var(--ink-300)] bg-[var(--ink-50)]/55 pl-11 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            // 44×44 touch target — WCAG AA on mobile.
            className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-white hover:text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs leading-5 text-[var(--ink-400)]">
          Use the password you set during registration or the last secure reset flow.
        </p>
      </div>

      {/* No dev-facing "sessions server-side" copy on the buyer/seller path.
          Admin operators may want the note; buyers should not care. */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="amber" className="flex-1" disabled={isPending}>
          {isPending ? "Signing in..." : mode === "admin" ? "Enter admin console" : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Link
          href="/auth/forgot-password"
          className={buttonVariants({ variant: "outline", className: "flex-1 w-full" })}
        >
          Reset password
        </Link>
      </div>

      {mode === "user" ? (
        <div className="flex flex-col gap-3 text-sm text-[var(--ink-500)] sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-6">
            Platform operators should use the dedicated admin sign-in route.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/login"
              className="font-semibold text-[var(--ink-900)] transition hover:text-[var(--amber-dark)]"
            >
              Admin sign-in
            </Link>
            <Link
              href="/auth/signup?role=seller"
              className="font-semibold text-[var(--ink-900)] transition hover:text-[var(--amber-dark)]"
            >
              Create seller account
            </Link>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function otpPhone(error: ApiError, identifier: string) {
  const fromDetails = error.details?.find((detail) => detail.field === "phone")?.value;
  if (typeof fromDetails === "string" && fromDetails.trim().length > 0) {
    return fromDetails;
  }

  return identifier.startsWith("+") ? identifier : null;
}
