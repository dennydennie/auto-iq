"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  RegisterRequest,
  RegisterResponse,
} from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  PasswordField,
  assessPassword,
} from "@/components/auth/password-field";

import { isApiFailure, postJson } from "@/lib/web-api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoleKey = "buyer" | "seller";

type RegisterFormState = {
  fullName: string;
  email: string;
  city: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedRules: boolean;
};

// Default `acceptedRules` to false so users make an active choice — the earlier
// pre-checked default was a dark pattern and unlikely to satisfy consent regs.
const INITIAL_FORM: RegisterFormState = {
  fullName: "",
  email: "",
  city: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptedRules: false,
};

function normalizeZimbabwePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("263")) return `+${digits}`;
  if (digits.startsWith("0")) return `+263${digits.slice(1)}`;
  return `+263${digits}`;
}

function requestFromForm(
  form: RegisterFormState,
  role: RoleKey,
): RegisterRequest {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    city: form.city.trim(),
    phone: normalizeZimbabwePhone(form.phone),
    password: form.password,
    role: role === "seller" ? "SELLER" : "BUYER",
  };
}

function otpHref(payload: RegisterResponse, role: RoleKey) {
  const params = new URLSearchParams({
    identifier: payload.email,
    role,
    registered: payload.otpRequired ? "1" : "0",
  });
  return `/auth/otp?${params.toString()}`;
}

export function RegisterForm({ role = "buyer" }: { role?: RoleKey }) {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    // Clear the top-level error the moment the user reacts to it.
    if (error) setError(null);
  }

  // Live derived state — no need to wait for submit to warn about mismatches.
  const passwordStrength = assessPassword(form.password);
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const phonePreview = form.phone ? normalizeZimbabwePhone(form.phone) : "";

  const disableSubmit = useMemo(() => {
    if (isPending) return true;
    if (!form.acceptedRules) return true;
    if (passwordStrength === "weak" || passwordStrength === "empty")
      return true;
    if (passwordsMismatch || form.confirmPassword.length === 0) return true;
    return false;
  }, [
    isPending,
    form.acceptedRules,
    form.confirmPassword.length,
    passwordStrength,
    passwordsMismatch,
  ]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.acceptedRules) {
      setError({
        message: "Please review and accept the platform rules to continue.",
      });
      return;
    }
    if (passwordStrength === "weak") {
      setError({
        message:
          "Use a password with at least 8 characters and a mix of letters and numbers.",
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError({ message: "The password confirmation does not match." });
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await postJson<RegisterResponse>(
        "/api/auth/register",
        requestFromForm(form, role),
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      router.push(otpHref(result.data, role));
    });
  }

  const roleLabel = role === "seller" ? "seller" : "buyer";

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            name="fullName"
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            placeholder="e.g. Tendai Moyo"
            autoComplete="name"
            aria-invalid={Boolean(error)}
            enterKeyHint="next"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            enterKeyHint="next"
            required
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={form.city}
            onChange={(event) => setField("city", event.target.value)}
            placeholder="Harare"
            autoComplete="address-level2"
            aria-invalid={Boolean(error)}
            enterKeyHint="next"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-400)]">
              +263
            </span>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              className="pl-14"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="77 123 4567"
              autoComplete="tel"
              aria-invalid={Boolean(error)}
              aria-describedby="phone-help"
              enterKeyHint="next"
              required
            />
          </div>
          <p
            id="phone-help"
            className="text-xs leading-5 text-[var(--ink-400)]"
          >
            We&apos;ll send an SMS verification code to this number.
            {phonePreview && phonePreview !== "+263" ? (
              <span className="ml-1 font-mono text-[var(--ink-700)]">
                → {phonePreview}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <PasswordField
          id="password"
          name="password"
          label="Password"
          value={form.password}
          onChange={(value) => setField("password", value)}
          placeholder="Create a strong password"
          showStrength
          invalid={Boolean(error) && passwordStrength === "weak"}
        />
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(value) => setField("confirmPassword", value)}
          placeholder="Repeat your password"
          requirementHint={
            passwordsMismatch
              ? "Passwords don't match yet."
              : form.confirmPassword.length > 0 && !passwordsMismatch
                ? "Matches — you're good to go."
                : "Retype the password above to confirm."
          }
          invalid={passwordsMismatch}
        />
      </div>

      <Checkbox
        checked={form.acceptedRules}
        onChange={(event) => setField("acceptedRules", event.target.checked)}
        label={
          <>
            I agree to the{" "}
            <Link
              href="/about#terms"
              className="font-semibold text-[var(--ink-900)] underline"
            >
              platform rules
            </Link>{" "}
            and consent to verification and listing-related SMS/email.
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-[var(--ink-400)]">
          Next: SMS code to verify your phone, then you&apos;ll sign in as a{" "}
          {roleLabel}.
        </p>
        <Button
          type="submit"
          variant="amber"
          className="sm:min-w-44"
          disabled={disableSubmit}
        >
          {isPending ? "Creating account..." : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
