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
  CreateListingRequest,
  SellerListingDto,
  UpsertListingPricingRequest,
  UpsertListingSpecsRequest,
} from "@auto-iq/contracts/listings";
import type { MakeDto, ReferenceDataResponse, VehicleModelDto } from "@auto-iq/contracts/reference-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isApiFailure, postJson, putJson } from "@/lib/web-api";

type ListingFormState = {
  makeId: string;
  make: string;
  modelId: string;
  model: string;
  year: string;
  bodyType: BodyType;
  colour: string;
  locationLatitude: string;
  locationLongitude: string;
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
  consent: boolean;
};

type FieldErrors = Partial<Record<keyof ListingFormState | "form", string>>;
type SetField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => void;

const STEPS = [
  { title: "Vehicle", description: "Add the core details buyers use to identify the vehicle." },
  { title: "Condition", description: "Capture mechanical details and condition disclosure." },
  { title: "Pricing", description: "Set the asking price and negotiation preference." },
  { title: "Review", description: "Check the draft before it is saved to your workspace." },
] as const;

const FINAL_STEP = STEPS.length - 1;

const INITIAL_FORM: ListingFormState = {
  makeId: "",
  make: "",
  modelId: "",
  model: "",
  year: "2021",
  bodyType: BODY_TYPES[0],
  colour: "",
  locationLatitude: "",
  locationLongitude: "",
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
  consent: false,
};

function optionLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function sortByName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name);
}

function addRequired(errors: FieldErrors, key: keyof ListingFormState, value: string, label: string) {
  if (!value.trim()) {
    errors[key] = `${label} is required.`;
  }
}

function addNumberRange(
  errors: FieldErrors,
  key: keyof ListingFormState,
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

function validateVehicleStep(form: ListingFormState) {
  const errors: FieldErrors = {};
  addRequired(errors, "make", form.make, "Make");
  addRequired(errors, "model", form.model, "Model");
  addRequired(errors, "colour", form.colour, "Colour");
  addNumberRange(errors, "year", form.year, "Year", 1950, 2100);
  addNumberRange(errors, "locationLatitude", form.locationLatitude, "Latitude", -90, 90);
  addNumberRange(errors, "locationLongitude", form.locationLongitude, "Longitude", -180, 180);
  return errors;
}

function validateConditionStep(form: ListingFormState) {
  const errors: FieldErrors = {};
  addNumberRange(errors, "mileageKm", form.mileageKm, "Mileage", 0, 2_000_000);
  if (form.hasAccidentHistory) {
    addRequired(errors, "accidentNote", form.accidentNote, "Accident note");
  }
  return errors;
}

function validatePricingStep(form: ListingFormState) {
  const errors: FieldErrors = {};
  addNumberRange(errors, "askPriceUsd", form.askPriceUsd, "Ask price", 1, 10_000_000);
  return errors;
}

function validateReviewStep(form: ListingFormState) {
  return form.consent ? {} : { consent: "Confirm the listing details before saving." };
}

function validateStep(step: number, form: ListingFormState) {
  if (step === 0) return validateVehicleStep(form);
  if (step === 1) return validateConditionStep(form);
  if (step === 2) return validatePricingStep(form);
  return validateReviewStep(form);
}

function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

function specsPayloadFromForm(form: ListingFormState): UpsertListingSpecsRequest {
  return {
    makeId: form.makeId || undefined,
    make: form.make.trim(),
    modelId: form.modelId || undefined,
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
    locationLatitude: Number(form.locationLatitude),
    locationLongitude: Number(form.locationLongitude),
  };
}

function pricingPayloadFromForm(form: ListingFormState): UpsertListingPricingRequest {
  return {
    askPriceUsd: Number(form.askPriceUsd),
    negotiable: form.negotiable,
  };
}

function createPayloadFromForm(form: ListingFormState): CreateListingRequest {
  return {
    ...specsPayloadFromForm(form),
    ...pricingPayloadFromForm(form),
  };
}

function formFromListing(listing?: SellerListingDto): ListingFormState {
  if (!listing) {
    return INITIAL_FORM;
  }
  return {
    makeId: listing.specs.makeId ?? "",
    make: listing.specs.make,
    modelId: listing.specs.modelId ?? "",
    model: listing.specs.model,
    year: String(listing.specs.year),
    bodyType: listing.specs.bodyType,
    colour: listing.specs.colour,
    locationLatitude: listing.specs.locationCoordinates?.lat.toString() ?? "",
    locationLongitude: listing.specs.locationCoordinates?.lng.toString() ?? "",
    fuelType: listing.specs.fuelType,
    transmission: listing.specs.transmission,
    driveType: listing.specs.driveType,
    engineCapacity: listing.specs.engineCapacity ?? "",
    mileageKm: String(listing.specs.mileageKm),
    condition: listing.specs.condition,
    askPriceUsd: String(listing.pricing.askPriceUsd),
    negotiable: listing.pricing.negotiable,
    hasAccidentHistory: listing.specs.hasAccidentHistory,
    accidentNote: listing.specs.accidentNote ?? "",
    consent: false,
  };
}

function FieldMessage({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-[var(--reject)]">{message}</p> : null;
}

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

function VehicleStep({
  createMake,
  createModel,
  errors,
  form,
  isSavingTaxonomy,
  makes,
  newMakeName,
  newModelName,
  onMakeChange,
  onModelChange,
  setField,
  setNewMakeName,
  setNewModelName,
}: StepProps & TaxonomyStepProps) {
  const selectedMake = makes.find((make) => make.id === form.makeId) ?? null;
  const models = selectedMake?.models ?? [];

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <SelectField id="make" label="Make" value={form.makeId} onChange={(event) => onMakeChange(event.target.value)}>
          <option value="">Select make</option>
          {makes.map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
        </SelectField>
        <FieldMessage message={errors.make} />
        <div className="grid gap-2 rounded-[1.1rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-3 sm:grid-cols-[1fr_auto]">
          <Input
            aria-label="New make name"
            value={newMakeName}
            onChange={(event) => setNewMakeName(event.target.value)}
            placeholder="Add new make"
          />
          <Button type="button" variant="outline" onClick={createMake} disabled={isSavingTaxonomy}>
            Add make
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <SelectField id="model" label="Model" value={form.modelId} onChange={(event) => onModelChange(event.target.value)}>
          <option value="">Select model</option>
          {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
        </SelectField>
        <FieldMessage message={errors.model} />
        <div className="grid gap-2 rounded-[1.1rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-3 sm:grid-cols-[1fr_auto]">
          <Input
            aria-label="New model name"
            value={newModelName}
            onChange={(event) => setNewModelName(event.target.value)}
            placeholder={selectedMake ? `Add ${selectedMake.name} model` : "Select make first"}
            disabled={!selectedMake}
          />
          <Button type="button" variant="outline" onClick={createModel} disabled={!selectedMake || isSavingTaxonomy}>
            Add model
          </Button>
        </div>
      </div>
      <TextInputField id="year" label="Year" value={form.year} error={errors.year} onChange={(event) => setField("year", event.target.value)} type="number" min={1950} max={2100} required />
      <TextInputField id="colour" label="Colour" value={form.colour} error={errors.colour} onChange={(event) => setField("colour", event.target.value)} placeholder="White" required />
      <TextInputField id="location-latitude" label="Vehicle latitude" value={form.locationLatitude} error={errors.locationLatitude} onChange={(event) => setField("locationLatitude", event.target.value)} type="number" min={-90} max={90} step="0.000001" placeholder="-17.8252" required />
      <TextInputField id="location-longitude" label="Vehicle longitude" value={form.locationLongitude} error={errors.locationLongitude} onChange={(event) => setField("locationLongitude", event.target.value)} type="number" min={-180} max={180} step="0.000001" placeholder="31.0335" required />
      <SelectField id="body-type" label="Body type" value={form.bodyType} onChange={(event) => setField("bodyType", event.target.value as BodyType)}>
        {BODY_TYPES.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}
      </SelectField>
    </div>
  );
}

function ConditionStep({ errors, form, setField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <SelectField id="fuel-type" label="Fuel type" value={form.fuelType} onChange={(event) => setField("fuelType", event.target.value as FuelType)}>
          {FUEL_TYPES.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}
        </SelectField>
        <SelectField id="transmission" label="Transmission" value={form.transmission} onChange={(event) => setField("transmission", event.target.value as TransmissionType)}>
          {TRANSMISSION_TYPES.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}
        </SelectField>
        <SelectField id="drive-type" label="Drive type" value={form.driveType} onChange={(event) => setField("driveType", event.target.value as DriveType)}>
          {DRIVE_TYPES.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}
        </SelectField>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <TextInputField id="engine-capacity" label="Engine capacity" value={form.engineCapacity} onChange={(event) => setField("engineCapacity", event.target.value)} placeholder="2.4L" />
        <TextInputField id="mileage-km" label="Mileage (km)" value={form.mileageKm} error={errors.mileageKm} onChange={(event) => setField("mileageKm", event.target.value)} type="number" min={0} required />
        <SelectField id="condition" label="Condition" value={form.condition} onChange={(event) => setField("condition", event.target.value as ConditionGrade)}>
          {CONDITION_GRADES.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}
        </SelectField>
      </div>
      <Checkbox checked={form.hasAccidentHistory} onChange={(event) => setField("hasAccidentHistory", event.target.checked)} label="Vehicle has accident history" />
      {form.hasAccidentHistory ? (
        <TextInputField id="accident-note" label="Accident note" value={form.accidentNote} error={errors.accidentNote} onChange={(event) => setField("accidentNote", event.target.value)} placeholder="Describe the previous damage or repair work" />
      ) : null}
    </div>
  );
}

function PricingStep({ errors, form, setField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextInputField id="ask-price" label="Ask price (USD)" value={form.askPriceUsd} error={errors.askPriceUsd} onChange={(event) => setField("askPriceUsd", event.target.value)} type="number" min={1} step="0.01" placeholder="19500" required />
        <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
          Save an accurate asking price now. You can update the draft before sending it for review.
        </div>
      </div>
      <Checkbox checked={form.negotiable} onChange={(event) => setField("negotiable", event.target.checked)} label="Price is negotiable" />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-100)] py-3 last:border-b-0">
      <span className="text-[var(--ink-500)]">{label}</span>
      <span className="text-right font-semibold text-[var(--ink-900)]">{value}</span>
    </div>
  );
}

function ReviewStep({ errors, form, setField, setStep }: StepProps & { setStep: (step: number) => void }) {
  return (
    <div className="space-y-5">
      <ReviewSection title="Vehicle" step={0} setStep={setStep}>
        <ReviewRow label="Vehicle" value={`${form.year} ${form.make} ${form.model}`} />
        <ReviewRow label="Body and colour" value={`${optionLabel(form.bodyType)} · ${form.colour}`} />
        <ReviewRow label="Vehicle location" value={`${form.locationLatitude}, ${form.locationLongitude}`} />
      </ReviewSection>
      <ReviewSection title="Condition" step={1} setStep={setStep}>
        <ReviewRow label="Powertrain" value={`${optionLabel(form.fuelType)} · ${optionLabel(form.transmission)} · ${optionLabel(form.driveType)}`} />
        <ReviewRow label="Mileage" value={`${Number(form.mileageKm).toLocaleString()} km`} />
        <ReviewRow label="Accident history" value={form.hasAccidentHistory ? form.accidentNote : "None declared"} />
      </ReviewSection>
      <ReviewSection title="Pricing" step={2} setStep={setStep}>
        <ReviewRow label="Ask price" value={`USD ${Number(form.askPriceUsd).toLocaleString()}`} />
        <ReviewRow label="Negotiable" value={form.negotiable ? "Yes" : "No"} />
      </ReviewSection>
      <Checkbox checked={form.consent} onChange={(event) => setField("consent", event.target.checked)} label="I confirm these details are accurate enough to save this draft listing." />
      <FieldMessage message={errors.consent} />
    </div>
  );
}

function ReviewSection({
  children,
  setStep,
  step,
  title,
}: {
  children: ReactNode;
  setStep: (step: number) => void;
  step: number;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="display text-2xl text-[var(--ink-900)]">{title}</h3>
          <button type="button" className={buttonVariants({ variant: "ghost", size: "sm" })} onClick={() => setStep(step)}>
            Edit
          </button>
        </div>
        <div className="text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

type StepProps = {
  errors: FieldErrors;
  form: ListingFormState;
  setField: SetField;
};

type TaxonomyStepProps = {
  createMake: () => void;
  createModel: () => void;
  isSavingTaxonomy: boolean;
  makes: MakeDto[];
  newMakeName: string;
  newModelName: string;
  onMakeChange: (makeId: string) => void;
  onModelChange: (modelId: string) => void;
  setNewMakeName: (value: string) => void;
  setNewModelName: (value: string) => void;
};

export function CreateListingForm({
  initialListing,
  mode = "create",
  referenceData,
}: {
  initialListing?: SellerListingDto;
  mode?: "create" | "edit";
  referenceData: ReferenceDataResponse;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingFormState>(() => formFromListing(initialListing));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [makes, setMakes] = useState(referenceData.makes);
  const [newMakeName, setNewMakeName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [isSavingTaxonomy, setIsSavingTaxonomy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const stepDetails = STEPS[step];
  const editableListingId = mode === "edit" ? initialListing?.id : undefined;
  const isEditMode = Boolean(editableListingId);

  function setField<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function selectMake(makeId: string) {
    const make = makes.find((entry) => entry.id === makeId);
    setForm((current) => ({
      ...current,
      makeId: make?.id ?? "",
      make: make?.name ?? "",
      modelId: "",
      model: "",
    }));
    setErrors((current) => ({ ...current, make: undefined, model: undefined, form: undefined }));
  }

  function selectModel(modelId: string) {
    const make = makes.find((entry) => entry.id === form.makeId);
    const model = make?.models.find((entry) => entry.id === modelId);
    setForm((current) => ({
      ...current,
      modelId: model?.id ?? "",
      model: model?.name ?? "",
    }));
    setErrors((current) => ({ ...current, model: undefined, form: undefined }));
  }

  async function createMake() {
    const name = newMakeName.trim();
    if (!name) {
      setErrors((current) => ({ ...current, make: "Enter a make name before saving it." }));
      return;
    }
    setIsSavingTaxonomy(true);
    const result = await postJson<MakeDto>("/api/reference-data/makes", { name });
    setIsSavingTaxonomy(false);
    if (isApiFailure(result)) {
      setErrors((current) => ({ ...current, make: result.error.message }));
      return;
    }
    setMakes((current) => [...current.filter((make) => make.id !== result.data.id), result.data].sort(sortByName));
    setNewMakeName("");
    setForm((current) => ({
      ...current,
      makeId: result.data.id,
      make: result.data.name,
      modelId: "",
      model: "",
    }));
  }

  async function createModel() {
    const name = newModelName.trim();
    if (!form.makeId) {
      setErrors((current) => ({ ...current, model: "Select or add a make before adding a model." }));
      return;
    }
    if (!name) {
      setErrors((current) => ({ ...current, model: "Enter a model name before saving it." }));
      return;
    }
    setIsSavingTaxonomy(true);
    const result = await postJson<VehicleModelDto>(`/api/reference-data/makes/${form.makeId}/models`, { name });
    setIsSavingTaxonomy(false);
    if (isApiFailure(result)) {
      setErrors((current) => ({ ...current, model: result.error.message }));
      return;
    }
    setMakes((current) => current.map((make) => {
      if (make.id !== result.data.makeId) {
        return make;
      }
      const models = [...make.models.filter((model) => model.id !== result.data.id), result.data].sort(sortByName);
      return { ...make, models, popularModels: models.map((model) => model.name) };
    }));
    setNewModelName("");
    setForm((current) => ({
      ...current,
      modelId: result.data.id,
      model: result.data.name,
    }));
  }

  function validateCurrentStep() {
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  }

  function goToStep(nextStep: number) {
    setErrors({});
    setStep(nextStep);
  }

  function handleNext() {
    if (validateCurrentStep()) {
      goToStep(Math.min(FINAL_STEP, step + 1));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < FINAL_STEP) {
      handleNext();
      return;
    }
    if (!validateCurrentStep()) return;

    startTransition(async () => {
      if (editableListingId) {
        const specsResult = await putJson<SellerListingDto>(
          `/api/seller/listings/${editableListingId}/specs`,
          specsPayloadFromForm(form),
        );
        if (isApiFailure(specsResult)) {
          setErrors({ form: specsResult.error.message });
          return;
        }
        const pricingResult = await putJson<SellerListingDto>(
          `/api/seller/listings/${editableListingId}/pricing`,
          pricingPayloadFromForm(form),
        );
        if (isApiFailure(pricingResult)) {
          setErrors({ form: pricingResult.error.message });
          return;
        }
        router.push(`/seller/listings/${editableListingId}`);
        router.refresh();
        return;
      }

      const result = await postJson<SellerListingDto>("/api/seller/listings", createPayloadFromForm(form));
      if (isApiFailure(result)) {
        setErrors({ form: result.error.message });
        return;
      }

      router.push(`/seller/listings/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errors.form ? <ErrorBanner message={errors.form} /> : null}

      <StepIndicator currentStep={step + 1} totalSteps={STEPS.length} label="Seller listing wizard" />

      <section className="space-y-2">
        <Badge variant="outline">Step {step + 1}</Badge>
        <h2 className="display text-3xl text-[var(--ink-900)]">{stepDetails.title}</h2>
        <p className="max-w-2xl text-sm leading-7 text-[var(--ink-500)]">{stepDetails.description}</p>
      </section>

      {step === 0 ? (
        <VehicleStep
          createMake={createMake}
          createModel={createModel}
          errors={errors}
          form={form}
          isSavingTaxonomy={isSavingTaxonomy}
          makes={makes}
          newMakeName={newMakeName}
          newModelName={newModelName}
          onMakeChange={selectMake}
          onModelChange={selectModel}
          setField={setField}
          setNewMakeName={setNewMakeName}
          setNewModelName={setNewModelName}
        />
      ) : null}
      {step === 1 ? <ConditionStep errors={errors} form={form} setField={setField} /> : null}
      {step === 2 ? <PricingStep errors={errors} form={form} setField={setField} /> : null}
      {step === 3 ? <ReviewStep errors={errors} form={form} setField={setField} setStep={goToStep} /> : null}

      <div className="flex flex-col gap-3 border-t border-[var(--ink-100)] pt-5 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={isPending}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Link href="/seller" className={buttonVariants({ variant: "outline" })}>
            Back to seller dashboard
          </Link>
        )}

        {step < FINAL_STEP ? (
          <Button type="button" variant="amber" onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" variant="amber" disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Save listing changes" : "Save draft listing"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
