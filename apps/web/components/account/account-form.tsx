"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type {
  DeliveryPreference,
  MeResponse,
  PaymentPreference,
  UpdateMeRequest,
  VehiclePurpose,
} from "@auto-iq/contracts/identity";
import type {
  ReferenceDataResponse,
  ReferenceOptionDto,
} from "@auto-iq/contracts/reference-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorBanner } from "@/components/shared/error-banner";
import { AccountDeletionCard } from "@/components/account/account-deletion-card";
import { isApiFailure, patchJson } from "@/lib/web-api";

type FormState = {
  fullName: string;
  city: string;
  email: string;
  phone: string;
  preferredMakes: string;
  preferredBodyTypes: string[];
  vehiclePurpose: string;
  searchRadiusKm: string;
  deliveryPreference: string;
  paymentPreference: string;
  preferredFuelTypes: string[];
  preferredTransmissions: string[];
  minSeats: string;
  maxMileageKm: string;
  yearMin: string;
  yearMax: string;
  budgetMin: string;
  budgetMax: string;
  businessName: string;
};

type ChoiceField =
  | "preferredBodyTypes"
  | "preferredFuelTypes"
  | "preferredTransmissions";
type TextField = Exclude<keyof FormState, ChoiceField>;

const PURPOSE_OPTIONS = [
  { value: "PERSONAL", label: "Personal use" },
  { value: "FAMILY", label: "Family use" },
  { value: "BUSINESS", label: "Business use" },
  { value: "RIDE_HAILING", label: "Taxi or ride hailing" },
  { value: "DELIVERY", label: "Delivery work" },
  { value: "OTHER", label: "Other" },
];
const DELIVERY_OPTIONS = [
  { value: "PICKUP", label: "I can collect" },
  { value: "DELIVERY", label: "Delivery required" },
  { value: "EITHER", label: "Either" },
];
const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "FINANCE", label: "Finance" },
  { value: "EITHER", label: "Cash or finance" },
];
export function AccountForm({
  profile,
  referenceData,
}: {
  profile: MeResponse;
  referenceData: ReferenceDataResponse;
}) {
  const [form, setForm] = useState(() => toFormState(profile));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: TextField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError(null);
  }

  function toggleChoice(field: ChoiceField, value: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
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
        setError({
          message: result.error.message,
          correlationId: result.error.correlationId,
        });
        setMessage("");
        return;
      }
      setForm(toFormState(result.data));
      setError(null);
      setMessage("Profile updated.");
    });
  }

  return (
    <div className="space-y-8">
      <form className="space-y-6" onSubmit={submit}>
        {error ? (
          <ErrorBanner
            message={error.message}
            correlationId={error.correlationId}
          />
        ) : null}
        {message ? (
          <p
            className="rounded-2xl bg-[var(--verified-soft)] px-4 py-3 text-sm font-medium text-[var(--verified)]"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <CardDescription>
              These details help buyers and sellers identify you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              name="fullName"
              value={form.fullName}
              onChange={updateField}
              required
            />
            <Field
              label="City"
              name="city"
              value={form.city}
              onChange={updateField}
              required
            />
            <ReadOnlyField
              label="Email"
              value={form.email}
              verified={profile.emailVerified}
            />
            <ReadOnlyField
              label="Phone"
              value={form.phone}
              verified={profile.phoneVerified}
            />
          </CardContent>
        </Card>

        {profile.buyerProfile ? (
          <BuyerPreferences
            form={form}
            referenceData={referenceData}
            updateField={updateField}
            toggleChoice={toggleChoice}
          />
        ) : null}
        {profile.sellerProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>Seller details</CardTitle>
              <CardDescription>
                Keep your business identity current for listings and enquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field
                label="Business name"
                name="businessName"
                value={form.businessName}
                onChange={updateField}
              />
            </CardContent>
          </Card>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="amber" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      <AccountDeletionCard />
    </div>
  );
}

function BuyerPreferences({
  form,
  referenceData,
  updateField,
  toggleChoice,
}: {
  form: FormState;
  referenceData: ReferenceDataResponse;
  updateField: (field: TextField, value: string) => void;
  toggleChoice: (field: ChoiceField, value: string) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Buying plan</CardTitle>
          <CardDescription>
            Tell us how the vehicle will be used and how you plan to buy it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Vehicle purpose"
            name="vehiclePurpose"
            value={form.vehiclePurpose}
            onChange={updateField}
            options={PURPOSE_OPTIONS}
          />
          <SelectField
            label="Payment preference"
            name="paymentPreference"
            value={form.paymentPreference}
            onChange={updateField}
            options={PAYMENT_OPTIONS}
          />
          <Field
            label="Minimum budget (USD)"
            name="budgetMin"
            value={form.budgetMin}
            onChange={updateField}
            type="number"
            min="0"
            step="0.01"
          />
          <Field
            label="Maximum budget (USD)"
            name="budgetMax"
            value={form.budgetMax}
            onChange={updateField}
            type="number"
            min="0"
            step="0.01"
          />
          <Field
            label="Search radius (km)"
            name="searchRadiusKm"
            value={form.searchRadiusKm}
            onChange={updateField}
            type="number"
            min="1"
            max="1000"
            step="1"
          />
          <SelectField
            label="Delivery preference"
            name="deliveryPreference"
            value={form.deliveryPreference}
            onChange={updateField}
            options={DELIVERY_OPTIONS}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vehicle requirements</CardTitle>
          <CardDescription>
            Choose the details that matter most. Separate makes or body types
            with commas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred makes"
            name="preferredMakes"
            value={form.preferredMakes}
            onChange={updateField}
            placeholder="Toyota, Honda, Nissan"
          />
          <ChoiceGroup
            label="Body types"
            name="preferredBodyTypes"
            values={form.preferredBodyTypes}
            options={referenceData.bodyTypes}
            onToggle={toggleChoice}
          />
          <ChoiceGroup
            label="Fuel types"
            name="preferredFuelTypes"
            values={form.preferredFuelTypes}
            options={referenceData.fuelTypes}
            onToggle={toggleChoice}
          />
          <ChoiceGroup
            label="Transmissions"
            name="preferredTransmissions"
            values={form.preferredTransmissions}
            options={referenceData.transmissionTypes}
            onToggle={toggleChoice}
          />
          <Field
            label="Minimum seats"
            name="minSeats"
            value={form.minSeats}
            onChange={updateField}
            type="number"
            min="1"
            max="100"
            step="1"
          />
          <Field
            label="Maximum mileage (km)"
            name="maxMileageKm"
            value={form.maxMileageKm}
            onChange={updateField}
            type="number"
            min="0"
            max="10000000"
            step="1"
          />
          <Field
            label="Minimum year"
            name="yearMin"
            value={form.yearMin}
            onChange={updateField}
            type="number"
            min="1886"
            max="2200"
            step="1"
          />
          <Field
            label="Maximum year"
            name="yearMax"
            value={form.yearMax}
            onChange={updateField}
            type="number"
            min="1886"
            max="2200"
            step="1"
          />
        </CardContent>
      </Card>
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  name: TextField;
  value: string;
  onChange: (field: TextField, value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  const id = `account-${String(name)}`;
  return (
    <div className="space-y-2">
      <label
        className="text-sm font-semibold text-[var(--ink-900)]"
        htmlFor={id}
      >
        {label}
        {required ? " *" : ""}
      </label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        placeholder={placeholder}
        type={type}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: TextField;
  value: string;
  onChange: (field: TextField, value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `account-${String(name)}`;
  return (
    <div className="space-y-2">
      <label
        className="text-sm font-semibold text-[var(--ink-900)]"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-11 w-full rounded-xl border border-[var(--ink-200)] bg-white px-3.5 text-sm text-[var(--ink-900)] shadow-sm outline-none focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[var(--amber)]/35"
      >
        <option value="">No preference</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChoiceGroup({
  label,
  name,
  values,
  options,
  onToggle,
}: {
  label: string;
  name: ChoiceField;
  values: string[];
  options: ReferenceOptionDto[];
  onToggle: (field: ChoiceField, value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[var(--ink-900)]">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--ink-200)] px-3 text-sm"
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => onToggle(name, option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ReadOnlyField({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[var(--ink-900)]">
          {label}
        </label>
        <Badge variant={verified ? "success" : "outline"}>
          {verified ? "Verified" : "Not verified"}
        </Badge>
      </div>
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
    vehiclePurpose: profile.buyerProfile?.vehiclePurpose ?? "",
    searchRadiusKm: profile.buyerProfile?.searchRadiusKm?.toString() ?? "",
    deliveryPreference: profile.buyerProfile?.deliveryPreference ?? "",
    paymentPreference: profile.buyerProfile?.paymentPreference ?? "",
    preferredMakes: profile.buyerProfile?.preferredMakes.join(", ") ?? "",
    preferredBodyTypes: profile.buyerProfile?.preferredBodyTypes ?? [],
    preferredFuelTypes: profile.buyerProfile?.preferredFuelTypes ?? [],
    preferredTransmissions: profile.buyerProfile?.preferredTransmissions ?? [],
    minSeats: profile.buyerProfile?.minSeats?.toString() ?? "",
    maxMileageKm: profile.buyerProfile?.maxMileageKm?.toString() ?? "",
    yearMin: profile.buyerProfile?.yearMin?.toString() ?? "",
    yearMax: profile.buyerProfile?.yearMax?.toString() ?? "",
    budgetMin: profile.buyerProfile?.budgetMin?.toString() ?? "",
    budgetMax: profile.buyerProfile?.budgetMax?.toString() ?? "",
    businessName: profile.sellerProfile?.businessName ?? "",
  };
}

function toRequest(form: FormState, profile: MeResponse): UpdateMeRequest {
  const payload: UpdateMeRequest = { fullName: form.fullName, city: form.city };
  if (profile.buyerProfile) {
    payload.vehiclePurpose = choiceValue<VehiclePurpose>(form.vehiclePurpose);
    payload.searchRadiusKm = integerValue(form.searchRadiusKm);
    payload.deliveryPreference = choiceValue<DeliveryPreference>(
      form.deliveryPreference,
    );
    payload.paymentPreference = choiceValue<PaymentPreference>(
      form.paymentPreference,
    );
    payload.preferredMakes = commaList(form.preferredMakes);
    payload.preferredBodyTypes = form.preferredBodyTypes;
    payload.preferredFuelTypes = form.preferredFuelTypes;
    payload.preferredTransmissions = form.preferredTransmissions;
    payload.minSeats = integerValue(form.minSeats);
    payload.maxMileageKm = integerValue(form.maxMileageKm);
    payload.yearMin = integerValue(form.yearMin);
    payload.yearMax = integerValue(form.yearMax);
    payload.budgetMin = moneyValue(form.budgetMin);
    payload.budgetMax = moneyValue(form.budgetMax);
  }
  if (profile.sellerProfile)
    payload.businessName = form.businessName.trim() || null;
  return payload;
}

function commaList(value: string) {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function moneyValue(value: string) {
  return value.trim() ? Number(value) : null;
}

function integerValue(value: string) {
  return value.trim() ? Number(value) : null;
}

function choiceValue<T extends string>(value: string): T | null {
  return value ? (value as T) : null;
}

function validate(form: FormState) {
  if (!form.fullName.trim()) return "Full name is required.";
  if (!form.city.trim()) return "City is required.";
  const min = moneyValue(form.budgetMin);
  const max = moneyValue(form.budgetMax);
  if (min !== null && (Number.isNaN(min) || min < 0))
    return "Minimum budget must be zero or more.";
  if (max !== null && (Number.isNaN(max) || max < 0))
    return "Maximum budget must be zero or more.";
  if (min !== null && max !== null && min > max)
    return "Minimum budget cannot be greater than maximum budget.";
  const radiusError = validateInteger(
    form.searchRadiusKm,
    "Search radius",
    1,
    1000,
  );
  if (radiusError) return radiusError;
  const seatsError = validateInteger(form.minSeats, "Minimum seats", 1, 100);
  if (seatsError) return seatsError;
  const mileageError = validateInteger(
    form.maxMileageKm,
    "Maximum mileage",
    0,
    10_000_000,
  );
  if (mileageError) return mileageError;
  const minYearError = validateInteger(
    form.yearMin,
    "Minimum year",
    1886,
    2200,
  );
  if (minYearError) return minYearError;
  const maxYearError = validateInteger(
    form.yearMax,
    "Maximum year",
    1886,
    2200,
  );
  if (maxYearError) return maxYearError;
  const yearMin = integerValue(form.yearMin);
  const yearMax = integerValue(form.yearMax);
  if (yearMin !== null && yearMax !== null && yearMin > yearMax)
    return "Minimum year cannot be greater than maximum year.";
  return "";
}

function validateInteger(
  value: string,
  field: string,
  min: number,
  max: number,
) {
  const parsed = integerValue(value);
  if (parsed === null) return "";
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? ""
    : `${field} must be between ${min} and ${max}.`;
}
