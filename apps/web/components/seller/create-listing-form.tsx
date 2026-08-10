"use client";

import type {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResult } from "@auto-iq/contracts/error";
import {
  BODY_TYPES,
  CONDITION_GRADES,
  DRIVE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  type BodyType,
  type ConditionGrade,
  type DriveType,
  type FuelType,
  type TransmissionType,
} from "@auto-iq/contracts/enums";
import {
  MIN_LISTING_PHOTOS,
  MIN_SELLER_DISCLOSURE_LENGTH,
  type CreateListingRequest,
  type SellerListingDto,
  type SubmitListingRequest,
  type UpsertListingPricingRequest,
  type UpsertListingSpecsRequest,
} from "@auto-iq/contracts/listings";
import type {
  VehicleDocumentDto,
  VehicleImageDto,
} from "@auto-iq/contracts/storage";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Send,
} from "lucide-react";
import { DocumentUploader } from "@/components/seller/document-uploader";
import { PhotoUploader } from "@/components/seller/photo-uploader";
import { ErrorBanner } from "@/components/shared/error-banner";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatKm, formatPrice } from "@/lib/format";
import {
  disclosureIsReady,
  missingRequiredDocuments,
  photosAreReady,
} from "@/lib/listing-readiness";
import { isApiFailure, postJson, putJson } from "@/lib/web-api";

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
  sellerDisclosure: string;
  consent: boolean;
};

type FieldErrorKey = keyof ListingFormState | "documents" | "form" | "photos";
type FieldErrors = Partial<Record<FieldErrorKey, string>>;
type SetField = <K extends keyof ListingFormState>(
  key: K,
  value: ListingFormState[K],
) => void;
type StepProps = {
  errors: FieldErrors;
  form: ListingFormState;
  setField: SetField;
};

const STEPS = [
  { title: "Specs", description: "Describe the vehicle and its condition." },
  {
    title: "Pricing",
    description: "Set the asking price and negotiation preference.",
  },
  {
    title: "Photos",
    description: "Upload buyer-facing photos and select a cover.",
  },
  {
    title: "Documents",
    description: "Provide the ownership documents required for review.",
  },
  {
    title: "Review & submit",
    description: "Confirm every detail and send the listing to Auto IQ.",
  },
] as const;
const FINAL_STEP = STEPS.length - 1;

function createInitialForm(initialBodyType?: BodyType): ListingFormState {
  return {
    make: "",
    model: "",
    year: "2021",
    bodyType: initialBodyType ?? BODY_TYPES[0],
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
    sellerDisclosure: "",
    consent: false,
  };
}

function optionLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function addRequired(
  errors: FieldErrors,
  key: keyof ListingFormState,
  value: string,
  label: string,
) {
  if (!value.trim()) errors[key] = `${label} is required.`;
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

function validateSpecs(form: ListingFormState) {
  const errors: FieldErrors = {};
  addRequired(errors, "make", form.make, "Make");
  addRequired(errors, "model", form.model, "Model");
  addRequired(errors, "colour", form.colour, "Colour");
  addNumberRange(errors, "year", form.year, "Year", 1950, 2100);
  addNumberRange(errors, "mileageKm", form.mileageKm, "Mileage", 0, 2_000_000);
  if (form.hasAccidentHistory) {
    addRequired(errors, "accidentNote", form.accidentNote, "Accident note");
  }
  return errors;
}

function validatePricing(form: ListingFormState) {
  const errors: FieldErrors = {};
  addNumberRange(
    errors,
    "askPriceUsd",
    form.askPriceUsd,
    "Ask price",
    1,
    10_000_000,
  );
  return errors;
}

function validatePhotos(listing: SellerListingDto | null) {
  if (!listing || listing.images.length < MIN_LISTING_PHOTOS) {
    return {
      photos: `Upload at least ${MIN_LISTING_PHOTOS} photos before continuing.`,
    };
  }
  return listing.images.some((image) => image.isCover)
    ? {}
    : {
        photos: "Upload the front three-quarter photo to create a cover image.",
      };
}

function validateDocuments(listing: SellerListingDto | null) {
  if (!listing)
    return { documents: "Save the draft before uploading documents." };
  const missing = missingRequiredDocuments(listing.documents);
  return missing.length === 0
    ? {}
    : { documents: `Still required: ${missing.map(optionLabel).join(", ")}.` };
}

function validateReview(
  form: ListingFormState,
  listing: SellerListingDto | null,
) {
  const errors: FieldErrors = {
    ...validatePhotos(listing),
    ...validateDocuments(listing),
  };
  if (!disclosureIsReady(form.sellerDisclosure)) {
    errors.sellerDisclosure = `Add at least ${MIN_SELLER_DISCLOSURE_LENGTH} characters.`;
  }
  if (!form.consent)
    errors.consent = "Confirm the listing details before submission.";
  return errors;
}

function validateStep(
  step: number,
  form: ListingFormState,
  listing: SellerListingDto | null,
) {
  if (step === 0) return validateSpecs(form);
  if (step === 1) return validatePricing(form);
  if (step === 2) return validatePhotos(listing);
  if (step === 3) return validateDocuments(listing);
  return validateReview(form, listing);
}

function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

function specsFromForm(form: ListingFormState): UpsertListingSpecsRequest {
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
    accidentNote: form.hasAccidentHistory
      ? form.accidentNote.trim()
      : undefined,
  };
}

function pricingFromForm(form: ListingFormState): UpsertListingPricingRequest {
  return { askPriceUsd: Number(form.askPriceUsd), negotiable: form.negotiable };
}

function createPayload(form: ListingFormState): CreateListingRequest {
  return { ...specsFromForm(form), ...pricingFromForm(form) };
}

async function persistDraft(
  form: ListingFormState,
  listing: SellerListingDto | null,
): Promise<ApiResult<SellerListingDto>> {
  if (!listing) return postJson("/api/seller/listings", createPayload(form));
  const specs = await putJson<SellerListingDto>(
    `/api/seller/listings/${listing.id}/specs`,
    specsFromForm(form),
  );
  if (isApiFailure(specs)) return specs;
  return putJson<SellerListingDto>(
    `/api/seller/listings/${listing.id}/pricing`,
    pricingFromForm(form),
  );
}

function mergeImage(listing: SellerListingDto, image: VehicleImageDto) {
  const images = listing.images.filter((item) => item.slot !== image.slot);
  return { ...listing, images: [...images, image] };
}

function mergeDocument(
  listing: SellerListingDto,
  document: VehicleDocumentDto,
) {
  const documents = listing.documents.filter(
    (item) => item.documentType !== document.documentType,
  );
  return { ...listing, documents: [...documents, document] };
}

function FieldMessage({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs font-medium text-[var(--reject)]">{message}</p>
  ) : null;
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
      <Input
        id={id}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        {...props}
      />
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

function EnumOptions({ values }: { values: readonly string[] }) {
  return values.map((value) => (
    <option key={value} value={value}>
      {optionLabel(value)}
    </option>
  ));
}

function VehicleFields({ errors, form, setField }: StepProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextInputField
        id="make"
        label="Make"
        value={form.make}
        error={errors.make}
        onChange={(event) => setField("make", event.target.value)}
        placeholder="Toyota"
        required
      />
      <TextInputField
        id="model"
        label="Model"
        value={form.model}
        error={errors.model}
        onChange={(event) => setField("model", event.target.value)}
        placeholder="Hilux D/C"
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
        placeholder="White"
        required
      />
      <SelectField
        id="body-type"
        label="Body type"
        value={form.bodyType}
        onChange={(event) =>
          setField("bodyType", event.target.value as BodyType)
        }
      >
        <EnumOptions values={BODY_TYPES} />
      </SelectField>
    </div>
  );
}

function ConditionFields({ errors, form, setField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <SelectField
          id="fuel-type"
          label="Fuel type"
          value={form.fuelType}
          onChange={(event) =>
            setField("fuelType", event.target.value as FuelType)
          }
        >
          <EnumOptions values={FUEL_TYPES} />
        </SelectField>
        <SelectField
          id="transmission"
          label="Transmission"
          value={form.transmission}
          onChange={(event) =>
            setField("transmission", event.target.value as TransmissionType)
          }
        >
          <EnumOptions values={TRANSMISSION_TYPES} />
        </SelectField>
        <SelectField
          id="drive-type"
          label="Drive type"
          value={form.driveType}
          onChange={(event) =>
            setField("driveType", event.target.value as DriveType)
          }
        >
          <EnumOptions values={DRIVE_TYPES} />
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
          onChange={(event) =>
            setField("condition", event.target.value as ConditionGrade)
          }
        >
          <EnumOptions values={CONDITION_GRADES} />
        </SelectField>
      </div>
      <Checkbox
        checked={form.hasAccidentHistory}
        onChange={(event) =>
          setField("hasAccidentHistory", event.target.checked)
        }
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
    </div>
  );
}

function SpecsStep(props: StepProps) {
  return (
    <div className="space-y-6">
      <VehicleFields {...props} />
      <ConditionFields {...props} />
    </div>
  );
}

function PricingStep({ errors, form, setField }: StepProps) {
  return (
    <div className="space-y-5">
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
          placeholder="19500"
          required
        />
        <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
          Your draft is saved before photo uploads begin. You can return and
          update the price before submission.
        </div>
      </div>
      <Checkbox
        checked={form.negotiable}
        onChange={(event) => setField("negotiable", event.target.checked)}
        label="Price is negotiable"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-100)] py-3 last:border-b-0">
      <span className="text-[var(--ink-500)]">{label}</span>
      <span className="text-right font-semibold text-[var(--ink-900)]">
        {value}
      </span>
    </div>
  );
}

function ReviewSection({
  children,
  onEdit,
  title,
}: {
  children: ReactNode;
  onEdit: () => void;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="display text-2xl text-[var(--ink-900)]">{title}</h3>
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
        <div className="text-sm">{children}</div>
      </CardContent>
    </Card>
  );
}

function ReadinessRow({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  const Icon = complete ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-2 text-sm text-[var(--ink-700)]">
      <Icon
        className={
          complete ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-[var(--reject)]"
        }
        aria-hidden="true"
      />
      {label}
    </li>
  );
}

function ReviewStep({
  errors,
  form,
  listing,
  setField,
  setStep,
}: StepProps & {
  listing: SellerListingDto;
  setStep: (step: number) => void;
}) {
  const missingDocuments = missingRequiredDocuments(listing.documents);
  return (
    <div className="space-y-5">
      <ReviewSection title="Specs" onEdit={() => setStep(0)}>
        <ReviewRow
          label="Vehicle"
          value={`${form.year} ${form.make} ${form.model}`}
        />
        <ReviewRow
          label="Body and colour"
          value={`${optionLabel(form.bodyType)} · ${form.colour}`}
        />
        <ReviewRow
          label="Mileage"
          value={formatKm(form.mileageKm)}
        />
      </ReviewSection>
      <ReviewSection title="Pricing" onEdit={() => setStep(1)}>
        <ReviewRow
          label="Ask price"
          value={formatPrice(form.askPriceUsd, "USD")}
        />
        <ReviewRow label="Negotiable" value={form.negotiable ? "Yes" : "No"} />
      </ReviewSection>
      <ReviewSection title="Uploads" onEdit={() => setStep(2)}>
        <ul className="space-y-2 py-2">
          <ReadinessRow
            complete={photosAreReady(listing.images)}
            label={`${listing.images.length} photos uploaded with a cover`}
          />
          <ReadinessRow
            complete={missingDocuments.length === 0}
            label={
              missingDocuments.length === 0
                ? "All mandatory documents uploaded"
                : `Missing ${missingDocuments.map(optionLabel).join(", ")}`
            }
          />
        </ul>
      </ReviewSection>
      <div className="space-y-2">
        <Label htmlFor="seller-disclosure">Seller disclosure</Label>
        <Textarea
          id="seller-disclosure"
          value={form.sellerDisclosure}
          onChange={(event) => setField("sellerDisclosure", event.target.value)}
          placeholder="Describe service history, known faults, and why you are selling"
          aria-invalid={Boolean(errors.sellerDisclosure)}
        />
        <FieldMessage message={errors.sellerDisclosure} />
        <p className="text-xs text-[var(--ink-400)]">
          This is public on the buyer listing page.
        </p>
      </div>
      <Checkbox
        checked={form.consent}
        onChange={(event) => setField("consent", event.target.checked)}
        label="I confirm that the vehicle details, photos, documents, and disclosure are accurate."
      />
      <FieldMessage message={errors.consent} />
    </div>
  );
}

export function CreateListingForm({
  initialBodyType,
}: {
  initialBodyType?: BodyType;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => createInitialForm(initialBodyType));
  const [listing, setListing] = useState<SellerListingDto | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function goToStep(nextStep: number) {
    setErrors({});
    setStep(nextStep);
  }

  function validateCurrentStep() {
    const nextErrors = validateStep(step, form, listing);
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  }

  function saveDraftAndContinue() {
    startTransition(async () => {
      const result = await persistDraft(form, listing);
      if (isApiFailure(result))
        return setErrors({ form: result.error.message });
      setListing(result.data);
      goToStep(2);
    });
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    if (step === 1) return saveDraftAndContinue();
    goToStep(Math.min(FINAL_STEP, step + 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < FINAL_STEP) return handleNext();
    if (!validateCurrentStep() || !listing) return;
    startTransition(async () => {
      const body: SubmitListingRequest = {
        sellerDisclosure: form.sellerDisclosure.trim(),
      };
      const result = await postJson<SellerListingDto>(
        `/api/seller/listings/${listing.id}/submit`,
        body,
      );
      if (isApiFailure(result))
        return setErrors({ form: result.error.message });
      router.push(`/seller/listings/${listing.id}?flash=listing-submitted`);
      router.refresh();
    });
  }

  function handleImageUploaded(image: VehicleImageDto) {
    setListing((current) => (current ? mergeImage(current, image) : current));
    setErrors((current) => ({
      ...current,
      photos: undefined,
      form: undefined,
    }));
  }

  function handleDocumentUploaded(document: VehicleDocumentDto) {
    setListing((current) =>
      current ? mergeDocument(current, document) : current,
    );
    setErrors((current) => ({
      ...current,
      documents: undefined,
      form: undefined,
    }));
  }

  const stepDetails = STEPS[step];
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errors.form ? <ErrorBanner message={errors.form} /> : null}
      <StepIndicator
        currentStep={step + 1}
        totalSteps={STEPS.length}
        label="Seller listing wizard"
      />
      <section className="space-y-2">
        <Badge variant="outline">Step {step + 1}</Badge>
        <h2 className="display text-3xl text-[var(--ink-900)]">
          {stepDetails.title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[var(--ink-500)]">
          {stepDetails.description}
        </p>
        {listing && step >= 2 ? (
          <p className="text-xs font-medium text-emerald-700">
            Draft saved automatically.
          </p>
        ) : null}
      </section>

      {step === 0 ? (
        <SpecsStep errors={errors} form={form} setField={setField} />
      ) : null}
      {step === 1 ? (
        <PricingStep errors={errors} form={form} setField={setField} />
      ) : null}
      {step === 2 && listing ? (
        <>
          <PhotoUploader
            listingId={listing.id}
            images={listing.images}
            onUploaded={handleImageUploaded}
          />
          <FieldMessage message={errors.photos} />
        </>
      ) : null}
      {step === 3 && listing ? (
        <>
          <DocumentUploader
            listingId={listing.id}
            documents={listing.documents}
            onUploaded={handleDocumentUploaded}
          />
          <FieldMessage message={errors.documents} />
        </>
      ) : null}
      {step === 4 && listing ? (
        <ReviewStep
          errors={errors}
          form={form}
          listing={listing}
          setField={setField}
          setStep={goToStep}
        />
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[var(--ink-100)] pt-5 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(step - 1)}
            disabled={isPending}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Link
            href="/seller"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to seller dashboard
          </Link>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          {listing ? (
            <Link
              href={`/seller/listings/${listing.id}`}
              className={buttonVariants({ variant: "ghost" })}
            >
              Save and exit
            </Link>
          ) : null}
          {step < FINAL_STEP ? (
            <Button
              type="button"
              variant="amber"
              onClick={handleNext}
              disabled={isPending}
            >
              {isPending ? "Saving draft..." : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" variant="amber" disabled={isPending}>
              <Send className="h-4 w-4" />
              {isPending ? "Submitting..." : "Submit for review"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
