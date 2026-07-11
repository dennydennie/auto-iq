"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  BodyType,
  FuelType,
  TransmissionType,
  UrgencyLevel,
} from "@auto-iq/contracts/enums";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import type {
  CreateVehicleRequestRequest,
  VehicleRequestDto,
} from "@auto-iq/contracts/vehicle-requests";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

export function VehicleRequestForm({
  referenceData,
}: {
  referenceData: ReferenceDataResponse;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = requestPayload(new FormData(form));
    setFormError(null);
    startTransition(async () => {
      const result = await postJson<VehicleRequestDto>(
        "/api/vehicle-requests",
        payload,
      );
      if (isApiFailure(result)) {
        setFormError(result.error);
        toast({
          title: "Couldn't submit request",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      form.reset();
      toast({
        title: "Vehicle request submitted",
        description: "Our sourcing team can now review it.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
      {formError ? (
        <div className="md:col-span-2">
          <ErrorBanner
            message={formError.message}
            correlationId={formError.correlationId}
          />
        </div>
      ) : null}
      <Field
        label="Maximum budget (ZWG)"
        name="maxBudget"
        type="number"
        min="0.01"
        step="0.01"
        required
      />
      <SelectField
        label="Urgency"
        name="urgency"
        required
        options={[
          { value: "ASAP", label: "As soon as possible" },
          { value: "ONE_MONTH", label: "Within one month" },
          { value: "BROWSING", label: "Just browsing" },
        ]}
      />
      <SelectField
        label="Preferred make"
        name="makeId"
        options={referenceData.makes.map((make) => ({
          value: make.id,
          label: make.name,
        }))}
      />
      <Field label="Preferred model" name="model" />
      <Field label="Minimum year" name="yearMin" type="number" min="1900" />
      <Field label="Maximum year" name="yearMax" type="number" min="1900" />
      <SelectField
        label="Body type"
        name="bodyTypeId"
        options={referenceData.bodyTypes}
      />
      <SelectField
        label="Fuel type"
        name="fuelTypeId"
        options={referenceData.fuelTypes}
      />
      <SelectField
        label="Transmission"
        name="transmissionTypeId"
        options={referenceData.transmissionTypes}
      />
      <Field
        label="Maximum mileage (km)"
        name="maxOdometerKm"
        type="number"
        min="0"
      />
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="request-notes">Notes</Label>
        <Textarea
          id="request-notes"
          name="notes"
          placeholder="Colour, features, or other preferences"
        />
      </div>
      <Button
        className="md:col-span-2"
        variant="amber"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Submitting..." : "Request this vehicle"}
      </Button>
    </form>
  );
}

function requestPayload(data: FormData): CreateVehicleRequestRequest {
  return {
    maxBudgetCents: Math.round(Number(data.get("maxBudget")) * 100),
    urgency: requiredValue(data, "urgency") as UrgencyLevel,
    makeId: optionalValue(data, "makeId"),
    model: optionalValue(data, "model"),
    yearMin: optionalNumber(data, "yearMin"),
    yearMax: optionalNumber(data, "yearMax"),
    bodyTypeId: optionalValue(data, "bodyTypeId") as BodyType | undefined,
    fuelTypeId: optionalValue(data, "fuelTypeId") as FuelType | undefined,
    transmissionTypeId: optionalValue(data, "transmissionTypeId") as
      | TransmissionType
      | undefined,
    maxOdometerKm: optionalNumber(data, "maxOdometerKm"),
    notes: optionalValue(data, "notes"),
  };
}

function requiredValue(data: FormData, name: string) {
  return String(data.get(name) ?? "").trim();
}

function optionalValue(data: FormData, name: string) {
  return requiredValue(data, name) || undefined;
}

function optionalNumber(data: FormData, name: string) {
  const value = optionalValue(data, name);
  return value === undefined ? undefined : Number(value);
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`request-${name}`}>{label}</Label>
      <Input id={`request-${name}`} name={name} {...props} />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`request-${name}`}>{label}</Label>
      <Select id={`request-${name}`} name={name} required={required}>
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
