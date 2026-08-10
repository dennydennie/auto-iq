"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  InspectionFindingRating,
} from "@auto-iq/contracts/enums";
import { INSPECTION_FINDING_RATINGS } from "@auto-iq/contracts/enums";
import type {
  InspectionFindingInput,
  InspectionPhotoPresignRequest,
  InspectionPhotoPresignResponse,
  InspectionReportDto,
  SubmitInspectionReportRequest,
} from "@auto-iq/contracts/inspections";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { isApiFailure, postJson } from "@/lib/web-api";
import { labelizeEnum } from "@/lib/vehicle-ui";
import {
  createInspectionFindings,
  inspectionScore,
} from "@/lib/inspection-workflow";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 10 * 1024 * 1024;
type FindingState = InspectionFindingInput & { photoName?: string };

export function InspectionReportForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [findings, setFindings] = useState<FindingState[]>(() =>
    createInspectionFindings(),
  );
  const [inspectorNote, setInspectorNote] = useState("");
  const [roadworthy, setRoadworthy] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; correlationId?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const score = useMemo(() => inspectionScore(findings), [findings]);

  function updateFinding(index: number, update: Partial<FindingState>) {
    setFindings((current) => current.map((finding, itemIndex) =>
      itemIndex === index ? { ...finding, ...update } : finding));
  }

  async function uploadPhoto(index: number, file: File) {
    if (!validPhoto(file, toast)) return;
    setUploadingIndex(index);
    const body: InspectionPhotoPresignRequest = {
      contentType: file.type as InspectionPhotoPresignRequest["contentType"],
      contentLength: file.size,
    };
    const presign = await postJson<InspectionPhotoPresignResponse>(
      `/api/inspector/tasks/${taskId}/photos/presign`,
      body,
    );
    if (isApiFailure(presign)) {
      setUploadingIndex(null);
      setError(presign.error);
      return;
    }
    const uploaded = await putPhoto(presign.data.uploadUrl, file);
    if (!uploaded) {
      setUploadingIndex(null);
      setError({ message: "The evidence photo could not be uploaded." });
      return;
    }
    updateFinding(index, {
      photoStorageKey: presign.data.storageKey,
      photoName: file.name,
    });
    setUploadingIndex(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const body: SubmitInspectionReportRequest = {
      findings: findings.map(({ photoName: _photoName, ...finding }) => finding),
      inspectorNote: inspectorNote.trim(),
      roadworthy,
    };
    startTransition(async () => {
      const result = await postJson<InspectionReportDto>(
        `/api/inspector/tasks/${taskId}/report`,
        body,
      );
      if (isApiFailure(result)) {
        setError(result.error);
        return;
      }
      toast({
        title: "Inspection report submitted",
        description: "Admin can now review and approve the buyer summary.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      {error ? (
        <ErrorBanner message={error.message} correlationId={error.correlationId} />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-[var(--ink-50)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ink-900)]">Computed score</p>
          <p className="text-xs text-[var(--ink-500)]">Calculated from all checklist ratings</p>
        </div>
        <span className="text-3xl font-semibold text-[var(--ink-900)]">{score}/100</span>
      </div>

      {findings.map((finding, index) => (
        <FindingEditor
          key={finding.category}
          finding={finding}
          index={index}
          uploading={uploadingIndex === index}
          onChange={(update) => updateFinding(index, update)}
          onPhoto={(file) => uploadPhoto(index, file)}
        />
      ))}

      <div className="space-y-2">
        <Label htmlFor="inspector-note">Inspector summary</Label>
        <Textarea
          id="inspector-note"
          value={inspectorNote}
          onChange={(event) => setInspectorNote(event.target.value)}
          placeholder="Summarize condition, key risks, and recommended next steps."
          minLength={1}
          maxLength={4000}
          required
        />
      </div>
      <Checkbox
        checked={roadworthy}
        onChange={(event) => setRoadworthy(event.target.checked)}
        label="Vehicle is roadworthy"
      />
      <Button
        type="submit"
        variant="amber"
        disabled={isPending || uploadingIndex !== null || !inspectorNote.trim()}
      >
        {isPending ? "Submitting..." : "Submit inspection report"}
      </Button>
    </form>
  );
}

function FindingEditor({
  finding,
  index,
  uploading,
  onChange,
  onPhoto,
}: {
  finding: FindingState;
  index: number;
  uploading: boolean;
  onChange: (update: Partial<FindingState>) => void;
  onPhoto: (file: File) => void;
}) {
  return (
    <fieldset className="space-y-4 rounded-[1.25rem] border border-[var(--ink-100)] p-4">
      <legend className="px-2 text-sm font-semibold text-[var(--ink-900)]">
        {index + 1}. {finding.label}
      </legend>
      <Badge variant="outline">{labelizeEnum(finding.category)}</Badge>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`${finding.label} rating`}>
        {INSPECTION_FINDING_RATINGS.map((rating) => (
          <RatingOption
            key={rating}
            name={`finding-rating-${index}`}
            rating={rating}
            checked={finding.rating === rating}
            onChange={() => onChange({ rating })}
          />
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`finding-note-${index}`}>Observation note</Label>
        <Textarea
          id={`finding-note-${index}`}
          value={finding.note ?? ""}
          onChange={(event) => onChange({ note: event.target.value })}
          maxLength={2000}
          placeholder="Record measurements, wear, faults, or supporting detail."
        />
      </div>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--ink-200)] px-4 py-2 text-sm font-semibold text-[var(--ink-900)] focus-within:ring-2 focus-within:ring-[var(--amber)]/45">
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          capture="environment"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPhoto(file);
            event.target.value = "";
          }}
        />
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {uploading ? "Uploading evidence..." : "Add evidence photo"}
      </label>
      {finding.photoName ? (
        <p className="inline-flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {finding.photoName} uploaded
        </p>
      ) : null}
    </fieldset>
  );
}

function RatingOption({
  name,
  rating,
  checked,
  onChange,
}: {
  name: string;
  rating: InspectionFindingRating;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={cn(
      "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition",
      checked
        ? "border-[var(--ink-900)] bg-[var(--ink-900)] text-white"
        : "border-[var(--ink-200)] bg-white text-[var(--ink-500)]",
    )}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {labelizeEnum(rating)}
    </label>
  );
}

function validPhoto(file: File, toast: ReturnType<typeof useToast>["toast"]) {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    toast({ title: "Unsupported photo", description: "Use JPEG, PNG, or WebP.", variant: "error" });
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast({ title: "Photo too large", description: "Evidence photos must be 10 MB or smaller.", variant: "error" });
    return false;
  }
  return true;
}

async function putPhoto(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  }).catch(() => null);
  return Boolean(response?.ok);
}
