"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { MeResponse, UpdateMeRequest } from "@auto-iq/contracts/identity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/shared/error-banner";
import { isApiFailure, patchJson } from "@/lib/web-api";

type FormState = {
  fullName: string;
  city: string;
  email: string;
  phone: string;
  preferredMakes: string;
  preferredBodyTypes: string;
  budgetMin: string;
  budgetMax: string;
  businessName: string;
};

export function AccountForm({ profile }: { profile: MeResponse }) {
  const [form, setForm] = useState(() => toFormState(profile));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(form);
    if (validation) {
      setError({ message: validation });
      setMessage("");
      return;
    }

    const payload = toRequest(form, profile);
    startTransition(async () => {
      const result = await patchJson<MeResponse>("/api/me", payload);
      if (isApiFailure(result)) {
        setError({ message: result.error.message, correlationId: result.error.correlationId });
        setMessage("");
        return;
      }
      setForm(toFormState(result.data));
      setError(null);
      setMessage("Profile updated.");
    });
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      {error ? <ErrorBanner message={error.message} correlationId={error.correlationId} /> : null}
      {message ? <p className="rounded-2xl bg-[var(--verified-soft)] px-4 py-3 text-sm font-medium text-[var(--verified)]" role="status">{message}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>These details help buyers and sellers identify you.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" name="fullName" value={form.fullName} onChange={updateField} required />
          <Field label="City" name="city" value={form.city} onChange={updateField} required />
          <ReadOnlyField label="Email" value={form.email} verified={profile.emailVerified} />
          <ReadOnlyField label="Phone" value={form.phone} verified={profile.phoneVerified} />
        </CardContent>
      </Card>

      {profile.buyerProfile ? <BuyerPreferences form={form} updateField={updateField} /> : null}
      {profile.sellerProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Seller details</CardTitle>
            <CardDescription>Keep your business identity current for listings and enquiries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Business name" name="businessName" value={form.businessName} onChange={updateField} />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="amber" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function BuyerPreferences({ form, updateField }: { form: FormState; updateField: (field: keyof FormState, value: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer preferences</CardTitle>
        <CardDescription>Separate multiple makes or body types with commas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred makes" name="preferredMakes" value={form.preferredMakes} onChange={updateField} placeholder="Toyota, Honda, Nissan" />
        <Field label="Preferred body types" name="preferredBodyTypes" value={form.preferredBodyTypes} onChange={updateField} placeholder="SUV, Sedan, Bakkie" />
        <Field label="Minimum budget" name="budgetMin" value={form.budgetMin} onChange={updateField} type="number" min="0" step="0.01" />
        <Field label="Maximum budget" name="budgetMax" value={form.budgetMax} onChange={updateField} type="number" min="0" step="0.01" />
      </CardContent>
    </Card>
  );
}

function Field({ label, name, value, onChange, required, placeholder, type = "text", min, step }: { label: string; name: keyof FormState; value: string; onChange: (field: keyof FormState, value: string) => void; required?: boolean; placeholder?: string; type?: string; min?: string; step?: string }) {
  const id = `account-${String(name)}`;
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--ink-900)]" htmlFor={id}>{label}{required ? " *" : ""}</label>
      <Input id={id} name={name} value={value} onChange={(event) => onChange(name, event.target.value)} required={required} placeholder={placeholder} type={type} min={min} step={step} />
    </div>
  );
}

function ReadOnlyField({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2"><label className="text-sm font-semibold text-[var(--ink-900)]">{label}</label><Badge variant={verified ? "success" : "outline"}>{verified ? "Verified" : "Not verified"}</Badge></div>
      <Input value={value} readOnly aria-readonly="true" />
    </div>
  );
}

function toFormState(profile: MeResponse): FormState {
  return {
    fullName: profile.fullName,
    city: profile.buyerProfile?.city ?? profile.sellerProfile?.city ?? "",
    email: profile.email,
    phone: profile.phone,
    preferredMakes: profile.buyerProfile?.preferredMakes.join(", ") ?? "",
    preferredBodyTypes: profile.buyerProfile?.preferredBodyTypes.join(", ") ?? "",
    budgetMin: profile.buyerProfile?.budgetMin?.toString() ?? "",
    budgetMax: profile.buyerProfile?.budgetMax?.toString() ?? "",
    businessName: profile.sellerProfile?.businessName ?? "",
  };
}

function toRequest(form: FormState, profile: MeResponse): UpdateMeRequest {
  const payload: UpdateMeRequest = { fullName: form.fullName, city: form.city };
  if (profile.buyerProfile) {
    payload.preferredMakes = commaList(form.preferredMakes);
    payload.preferredBodyTypes = commaList(form.preferredBodyTypes);
    payload.budgetMin = moneyValue(form.budgetMin);
    payload.budgetMax = moneyValue(form.budgetMax);
  }
  if (profile.sellerProfile) payload.businessName = form.businessName.trim() || null;
  return payload;
}

function commaList(value: string) {
  const seen = new Set<string>();
  return value.split(",").map((item) => item.trim()).filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function moneyValue(value: string) {
  return value.trim() ? Number(value) : null;
}

function validate(form: FormState) {
  if (!form.fullName.trim()) return "Full name is required.";
  if (!form.city.trim()) return "City is required.";
  const min = moneyValue(form.budgetMin);
  const max = moneyValue(form.budgetMax);
  if (min !== null && (Number.isNaN(min) || min < 0)) return "Minimum budget must be zero or more.";
  if (max !== null && (Number.isNaN(max) || max < 0)) return "Maximum budget must be zero or more.";
  if (min !== null && max !== null && min > max) return "Minimum budget cannot be greater than maximum budget.";
  return "";
}
