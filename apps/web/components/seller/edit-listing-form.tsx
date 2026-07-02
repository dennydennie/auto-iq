"use client";

import type { ChangeEvent, FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BODY_TYPES,
  CONDITION_GRADES,
  DRIVE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "@auto-iq/contracts/enums";
import type {
  BodyType,
  ConditionGrade,
  DriveType,
  FuelType,
  TransmissionType,
} from "@auto-iq/contracts/enums";
import type {
  SellerListingDto,
  UpsertListingPricingRequest,
  UpsertListingSpecsRequest,
} from "@auto-iq/contracts/listings";
import { ArrowLeft, Save } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isApiFailure, putJson } from "@/lib/web-api";

type FormState = {
  make: string;
  model: string;
  year: string;
  bodyType: BodyType;
  colour: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  engineCapacity: string;
  mileageKm: string;
  condition: ConditionGrade;
  hasAccidentHistory: boolean;
  accidentNote: string;
  askPriceUsd: string;
  negotiable: boolean;
};

type FieldErrors = Partial<Record<keyof FormState | "form", string>>;

function optionLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function initialFormFromListing(listing: SellerListingDto): FormState {
  return {
    make: listing.specs.make,
    model: listing.specs.model,
    year: String(listing.specs.year),
    bodyType: listing.specs.bodyType,
    colour: listing.specs.colour,
    fuelType: listing.specs.fuelType,
    transmission: listing.specs.transmission,
    driveType: listing.specs.driveType,
    engineCapacity: listing.specs.engineCapacity ?? "",
    mileageKm: String(listing.specs.mileageKm),
    condition: listing.specs.condition,
    hasAccidentHistory: listing.specs.hasAccidentHistory,
    accidentNote: listing.specs.accidentNote ?? "",
    askPriceUsd: String(listing.pricing.askPriceUsd),
    negotiable: listing.pricing.negotiable,
  };
}

function addRequired(errors: FieldErrors, key: keyof FormState, value: string, label: string) {
  if (!value.trim()) {
    errors[key] = `${label} is required.`;
  }
}

function addNumberRange(
  errors: FieldErrors,
  key: keyof FormState,
  value: string,
  label: string,
  min: number,
  max: number,
) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
  }
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  addRequired(errors, "make", form.make, "Make");
  addRequired(errors, "model", form.model, "Model");
  addRequired(errors, "colour", form.colour, "Colour");
  addNumberRange(errors, "year", form.year, "Year", 1950, 2100);
  addNumberRange(errors, "mileageKm", form.mileageKm, "Mileage", 0, 2_000_000);
  addNumberRange(errors, "askPriceUsd", form.askPriceUsd, "Ask price", 1, 10_000_000);
  if (form.hasAccidentHistory) {
    addRequired(errors, "accidentNote", form.accidentNote, "Accident note");
  }
  return errors;
}

function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

function specsPayload(form: FormState): UpsertListingSpecsRequest {
  return {
    make: form.make.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    bodyType: form.bodyType,
    colour: form.colour.trim(),
    fuelType: form.fuelType,
    transmission: form.transmission,
    driveType: form.driveType,
    engineCapacity: form.engineCapacity.trim() || undefined,
    mileageKm: Number(form.mileageKm),
    condition: form.condition,
    hasAccidentHistory: form.hasAccidentHistory,
    accidentNote: form.hasAccidentHistory ? form.accidentNote.trim() : undefined,
  };
}

function pricingPayload(form: FormState): UpsertListingPricingRequest {
  return {
    askPriceUsd: Number(form.askPriceUsd),
    negotiable: form.negotiable,
  };
}

function FieldMessage({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-[var(--reject)]">{message}</p> : null;
}

type SetField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

function TextInputField({
  error,
  id,
  label,
  onChange,
  value,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={onChange} aria-invalid={Boolean(error)} {...props} />
      <FieldMessage message={error} />
    </div>
  );
}

function SelectField({
  children,
  id,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  id: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={onChange}>
        {children}
      </Select>
    </div>
  );
}

export function EditListingForm({ listing }: { listing: SellerListingDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialFormFromListing(listing));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField: SetField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setSavedAt(null);
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    startTransition(async () => {
      const specsResult = await putJson<SellerListingDto>(
        `/api/seller/listings/${listing.id}/specs`,
        specsPayload(form),
      );

      if (isApiFailure(specsResult)) {
        setErrors({ form: specsResult.error.message });
        toast({ title: "Couldn't save specs", description: specsResult.error.message, variant: "error" });
        return;
      }

      const pricingResult = await putJson<SellerListingDto>(
        `/api/seller/listings/${listing.id}/pricing`,
        pricingPayload(form),
      );

      if (isApiFailure(pricingResult)) {
        setErrors({ form: pricingResult.error.message });
        toast({ title: "Couldn't save pricing", description: pricingResult.error.message, variant: "error" });
        return;
      }

      setSavedAt(new Date().toISOString());
      toast({
        title: "Listing updated",
        description: "Your draft is saved. Submit for review when you're ready.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errors.form ? <ErrorBanner message={errors.form} /> : null}
      {savedAt ? (
        <NoticeBanner message="Listing draft updated. Return to the listing to submit it for review." />
      ) : null}

      <Card>
        <CardHeader>
          <Badge variant="outline">Vehicle</Badge>
          <CardTitle className="mt-2">Core details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TextInputField
            id="make"
            label="Make"
            value={form.make}
            error={errors.make}
            onChange={(event) => setField("make", event.target.value)}
            required
          />
          <TextInputField
            id="model"
            label="Model"
            value={form.model}
            error={errors.model}
            onChange={(event) => setField("model", event.target.value)}
            required
          />
          <TextInputField
            id="year"
            label="Year"
            value={form.year}
            error={errors.year}
            onChange={(event) => setField("year", event.target.value)}
            type="number"
            min={1950}
            max={2100}
            required
          />
          <TextInputField
            id="colour"
            label="Colour"
            value={form.colour}
            error={errors.colour}
            onChange={(event) => setField("colour", event.target.value)}
            required
          />
          <SelectField
            id="body-type"
            label="Body type"
            value={form.bodyType}
            onChange={(event) => setField("bodyType", event.target.value as BodyType)}
          >
            {BODY_TYPES.map((value) => (
              <option key={value} value={value}>
                {optionLabel(value)}
              </option>
            ))}
          </SelectField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="outline">Condition</Badge>
          <CardTitle className="mt-2">Powertrain and disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <SelectField
              id="fuel-type"
              label="Fuel type"
              value={form.fuelType}
              onChange={(event) => setField("fuelType", event.target.value as FuelType)}
            >
              {FUEL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="transmission"
              label="Transmission"
              value={form.transmission}
              onChange={(event) => setField("transmission", event.target.value as TransmissionType)}
            >
              {TRANSMISSION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="drive-type"
              label="Drive type"
              value={form.driveType}
              onChange={(event) => setField("driveType", event.target.value as DriveType)}
            >
              {DRIVE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <TextInputField
              id="engine-capacity"
              label="Engine capacity"
              value={form.engineCapacity}
              onChange={(event) => setField("engineCapacity", event.target.value)}
              placeholder="2.4L"
            />
            <TextInputField
              id="mileage-km"
              label="Mileage (km)"
              value={form.mileageKm}
              error={errors.mileageKm}
              onChange={(event) => setField("mileageKm", event.target.value)}
              type="number"
              min={0}
              required
            />
            <SelectField
              id="condition"
              label="Condition"
              value={form.condition}
              onChange={(event) => setField("condition", event.target.value as ConditionGrade)}
            >
              {CONDITION_GRADES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </SelectField>
          </div>
          <Checkbox
            checked={form.hasAccidentHistory}
            onChange={(event) => setField("hasAccidentHistory", event.target.checked)}
            label="Vehicle has accident history"
          />
          {form.hasAccidentHistory ? (
            <TextInputField
              id="accident-note"
              label="Accident note"
              value={form.accidentNote}
              error={errors.accidentNote}
              onChange={(event) => setField("accidentNote", event.target.value)}
              placeholder="Describe the previous damage or repair work"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="outline">Pricing</Badge>
          <CardTitle className="mt-2">Asking price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <TextInputField
              id="ask-price"
              label="Ask price (USD)"
              value={form.askPriceUsd}
              error={errors.askPriceUsd}
              onChange={(event) => setField("askPriceUsd", event.target.value)}
              type="number"
              min={1}
              step="0.01"
              required
            />
            <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
              Update the asking price for this draft. The change is saved to the listing
              immediately — submit for review once everything is correct.
            </div>
          </div>
          <Checkbox
            checked={form.negotiable}
            onChange={(event) => setField("negotiable", event.target.checked)}
            label="Price is negotiable"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 border-t border-[var(--ink-100)] pt-5 sm:flex-row sm:justify-between">
        <Link
          href={`/seller/listings/${listing.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listing
        </Link>
        <Button type="submit" variant="amber" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving changes..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
