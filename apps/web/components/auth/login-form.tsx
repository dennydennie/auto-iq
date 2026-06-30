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
const SAFE_NEXT_PREFIXES = ["/buyer", "/saved", "/vehicles"];

function destinationFor(
  role: LoginResponse["role"],
  mode: "user" | "admin",
  nextHref?: string | null,
) {
  if (mode === "admin") {
    return "/admin";
  }

  if (ADMIN_ROLES.has(role)) {
    return "/admin";
  }

  if (nextHref && isSafeNextHref(nextHref)) {
    return nextHref;
  }

  if (role === "SELLER") {
    return "/seller";
  }

  return "/buyer";
}

function validateAdmin(role: LoginResponse["role"]) {
  return ADMIN_ROLES.has(role);
}

function isSafeNextHref(value: string) {
  return SAFE_NEXT_PREFIXES.some((prefix) => value === prefix || value.startsWith(`${prefix}/`));
}

export function LoginForm({
  mode = "user",
  nextHref = null,
}: {
  mode?: "user" | "admin";
  nextHref?: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({ identifier: "", password: "" });
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
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await postJson<LoginResponse>("/api/auth/login", form);
      if (isApiFailure(result)) {
        if (result.error.code === "OTP_REQUIRED") {
          const phone = otpPhone(result.error, form.identifier);
          if (phone) {
            const params = new URLSearchParams({ phone, registered: "0" });
            const email = otpEmail(result.error, form.identifier);
            if (email) {
              params.set("email", email);
            }
            router.push(`/auth/otp?${params.toString()}`);
            return;
          }
        }

        setError(result.error);
        return;
      }

      if (mode === "admin" && !validateAdmin(result.data.role)) {
        setError({ message: "This account does not have admin console access." });
        return;
      }

      router.push(destinationFor(result.data.role, mode, nextHref));
      router.refresh();
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
            value={form.identifier}
            onChange={(event) => setField("identifier", event.target.value)}
            placeholder="you@example.com or +263..."
            autoComplete="username"
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
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="h-12 rounded-2xl border-[var(--ink-300)] bg-[var(--ink-50)]/55 pl-11 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-white hover:text-[var(--ink-700)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs leading-5 text-[var(--ink-400)]">
          Use the password you set during registration or the last secure reset flow.
        </p>
      </div>

      <div className="rounded-[1.25rem] border border-[var(--ink-100)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8fafc_100%)] px-4 py-3">
        <p className="text-sm leading-6 text-[var(--ink-500)]">
          Sessions are established server-side and kept out of browser storage.
        </p>
      </div>

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

function otpEmail(error: ApiError, identifier: string) {
  const fromDetails = error.details?.find((detail) => detail.field === "email")?.value;
  if (typeof fromDetails === "string" && fromDetails.includes("@")) {
    return fromDetails;
  }

  return identifier.includes("@") ? identifier : null;
}
