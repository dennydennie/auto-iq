"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import type { CreateListingRequest, SellerListingDto } from "@auto-iq/contracts/listings";
import { ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { NoticeBanner } from "@/components/shared/notice-banner";

import { isApiFailure, postJson } from "@/lib/web-api";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ListingFormState = {
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
  askPriceUsd: string;
  negotiable: boolean;
  hasAccidentHistory: boolean;
  accidentNote: string;
};

const INITIAL_FORM: ListingFormState = {
  make: "",
  model: "",
  year: "2021",
  bodyType: BODY_TYPES[0],
  colour: "",
  fuelType: FUEL_TYPES[0],
  transmission: TRANSMISSION_TYPES[0],
  driveType: DRIVE_TYPES[0],
  engineCapacity: "",
  mileageKm: "0",
  condition: CONDITION_GRADES[1],
  askPriceUsd: "",
  negotiable: true,
  hasAccidentHistory: false,
  accidentNote: "",
};

function optionLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function payloadFromForm(form: ListingFormState): CreateListingRequest {
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
    accidentNote: form.hasAccidentHistory ? form.accidentNote.trim() || undefined : undefined,
    askPriceUsd: Number(form.askPriceUsd),
    negotiable: form.negotiable,
  };
}

export function CreateListingForm() {
  const [form, setForm] = useState<ListingFormState>(INITIAL_FORM);
  const [createdListing, setCreatedListing] = useState<SellerListingDto | null>(null);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedListing(null);

    startTransition(async () => {
      const result = await postJson<SellerListingDto>("/api/seller/listings", payloadFromForm(form));
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }

      setCreatedListing(result.data);
      setForm(INITIAL_FORM);
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}

      {createdListing ? (
        <NoticeBanner message={`Draft listing created: ${createdListing.id} (${createdListing.slug}). The record was saved through the live staging API and is ready for the next wizard steps.`} />
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={form.make}
              onChange={(event) => setField("make", event.target.value)}
              placeholder="Toyota"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(event) => setField("model", event.target.value)}
              placeholder="Hilux D/C"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min={1950}
              max={2100}
              value={form.year}
              onChange={(event) => setField("year", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body-type">Body type</Label>
            <Select
              id="body-type"
              value={form.bodyType}
              onChange={(event) => setField("bodyType", event.target.value as BodyType)}
            >
              {BODY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="colour">Colour</Label>
            <Input
              id="colour"
              value={form.colour}
              onChange={(event) => setField("colour", event.target.value)}
              placeholder="White"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fuel-type">Fuel type</Label>
            <Select
              id="fuel-type"
              value={form.fuelType}
              onChange={(event) => setField("fuelType", event.target.value as FuelType)}
            >
              {FUEL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <Select
              id="transmission"
              value={form.transmission}
              onChange={(event) => setField("transmission", event.target.value as TransmissionType)}
            >
              {TRANSMISSION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="drive-type">Drive type</Label>
            <Select
              id="drive-type"
              value={form.driveType}
              onChange={(event) => setField("driveType", event.target.value as DriveType)}
            >
              {DRIVE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="engine-capacity">Engine capacity</Label>
            <Input
              id="engine-capacity"
              value={form.engineCapacity}
              onChange={(event) => setField("engineCapacity", event.target.value)}
              placeholder="2.4L"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage-km">Mileage (km)</Label>
            <Input
              id="mileage-km"
              type="number"
              min={0}
              value={form.mileageKm}
              onChange={(event) => setField("mileageKm", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              id="condition"
              value={form.condition}
              onChange={(event) => setField("condition", event.target.value as ConditionGrade)}
            >
              {CONDITION_GRADES.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ask-price">Ask price (USD)</Label>
            <Input
              id="ask-price"
              type="number"
              min={1}
              step="0.01"
              value={form.askPriceUsd}
              onChange={(event) => setField("askPriceUsd", event.target.value)}
              placeholder="19500"
              required
            />
          </div>
          <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
            <p className="mt-2">
              Your draft is only saved when you submit this step. Save before leaving if you want
              to continue later.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Checkbox
            checked={form.negotiable}
            onChange={(event) => setField("negotiable", event.target.checked)}
            label="Price is negotiable"
          />
          <Checkbox
            checked={form.hasAccidentHistory}
            onChange={(event) => setField("hasAccidentHistory", event.target.checked)}
            label="Vehicle has accident history"
          />
        </div>

        {form.hasAccidentHistory ? (
          <div className="space-y-2">
            <Label htmlFor="accident-note">Accident note</Label>
            <Input
              id="accident-note"
              value={form.accidentNote}
              onChange={(event) => setField("accidentNote", event.target.value)}
              placeholder="Describe the previous damage or repair work"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" variant="amber" className="sm:min-w-56" disabled={isPending}>
            {isPending ? "Saving draft..." : "Save draft listing"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            href="/seller"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Back to seller dashboard
          </Link>
        </div>
      </form>

      <Card className="border-dashed">
        <CardContent className="space-y-2 p-5">
          <Badge variant="outline">What this saves</Badge>
          <p className="text-sm leading-6 text-[var(--ink-500)]">
            This step creates a real `DRAFT` listing record with specs and pricing. Media,
            documents, and submission can be layered on top of the same API-backed draft next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
