"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { RegisterRequest, RegisterResponse } from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";

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

const INITIAL_FORM: RegisterFormState = {
  fullName: "",
  email: "",
  city: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptedRules: true,
};

function normalizeZimbabwePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("263")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+263${digits.slice(1)}`;
  }

  return `+263${digits}`;
}

function requestFromForm(form: RegisterFormState, role: RoleKey): RegisterRequest {
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
    phone: payload.phone,
    role,
    registered: payload.otpRequired ? "1" : "0",
  });

  return `/auth/otp?${params.toString()}`;
}

export function RegisterForm({ role = "buyer" }: { role?: RoleKey }) {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateForm() {
    if (!form.acceptedRules) {
      return "You need to accept the platform rules before continuing.";
    }

    if (form.password !== form.confirmPassword) {
      return "The password confirmation does not match.";
    }

    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateForm();
    setError(validationMessage ? { message: validationMessage } : null);

    if (validationMessage) {
      return;
    }

    startTransition(async () => {
      const result = await postJson<RegisterResponse>("/api/auth/register", requestFromForm(form, role));
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      router.push(otpHref(result.data, role));
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            placeholder="e.g. Tendai Moyo"
            autoComplete="name"
            aria-invalid={Boolean(error)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(event) => setField("city", event.target.value)}
            placeholder="Harare"
            autoComplete="address-level2"
            aria-invalid={Boolean(error)}
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
              type="tel"
              className="pl-14"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="77 123 4567"
              autoComplete="tel"
              aria-invalid={Boolean(error)}
              required
            />
          </div>
          <p className="text-xs leading-5 text-[var(--ink-400)]">
            We&apos;ll send a one-time code to this number to verify your identity.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-invalid={Boolean(error)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            aria-invalid={Boolean(error)}
            required
          />
        </div>
      </div>

      <Checkbox
        checked={form.acceptedRules}
        onChange={(event) => setField("acceptedRules", event.target.checked)}
        label={
          <>
            I agree to the platform rules, privacy policy, and consent to contact through
            verification and listing-related workflows.
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-[var(--ink-400)]">
          Next up: OTP verification and role-specific onboarding.
        </p>
        <Button type="submit" variant="amber" className="sm:min-w-44" disabled={isPending}>
          {isPending ? "Creating account..." : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
