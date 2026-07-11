"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  INSPECTION_CATEGORIES,
  INSPECTION_FINDING_RATINGS,
} from "@auto-iq/contracts/enums";
import type {
  InspectionFindingInput,
  InspectionReportDto,
  SubmitInspectionReportRequest,
} from "@auto-iq/contracts/inspections";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isApiFailure, postJson } from "@/lib/web-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

const EMPTY_FINDING: InspectionFindingInput = {
  category: "ENGINE",
  label: "",
  rating: "PASS",
  note: "",
};

export function InspectionReportForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [findings, setFindings] = useState<InspectionFindingInput[]>([
    { ...EMPTY_FINDING },
  ]);
  const [inspectorNote, setInspectorNote] = useState("");
  const [roadworthy, setRoadworthy] = useState(true);
  const [overallScore, setOverallScore] = useState("100");
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateFinding(
    index: number,
    update: Partial<InspectionFindingInput>,
  ) {
    setFindings((current) =>
      current.map((finding, itemIndex) =>
        itemIndex === index ? { ...finding, ...update } : finding,
      ),
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body: SubmitInspectionReportRequest = {
      findings,
      inspectorNote: inspectorNote.trim(),
      roadworthy,
      overallScore: Number(overallScore),
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
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}
      {findings.map((finding, index) => (
        <fieldset
          key={index}
          className="grid gap-3 rounded-[1.25rem] border border-[var(--ink-100)] p-4 sm:grid-cols-2"
        >
          <legend className="px-2 text-sm font-semibold">
            Finding {index + 1}
          </legend>
          <Select
            aria-label={`Finding ${index + 1} category`}
            value={finding.category}
            onChange={(event) =>
              updateFinding(index, {
                category: event.target
                  .value as InspectionFindingInput["category"],
              })
            }
          >
            {INSPECTION_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
          <Select
            aria-label={`Finding ${index + 1} rating`}
            value={finding.rating}
            onChange={(event) =>
              updateFinding(index, {
                rating: event.target.value as InspectionFindingInput["rating"],
              })
            }
          >
            {INSPECTION_FINDING_RATINGS.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
          <Input
            aria-label={`Finding ${index + 1} label`}
            value={finding.label}
            onChange={(event) =>
              updateFinding(index, { label: event.target.value })
            }
            placeholder="Inspection item"
            required
          />
          <Input
            aria-label={`Finding ${index + 1} note`}
            value={finding.note}
            onChange={(event) =>
              updateFinding(index, { note: event.target.value })
            }
            placeholder="Observation"
          />
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setFindings((current) => [...current, { ...EMPTY_FINDING }])
        }
      >
        Add finding
      </Button>
      <div className="space-y-2">
        <Label htmlFor="overall-score">Overall score</Label>
        <Input
          id="overall-score"
          type="number"
          min="0"
          max="100"
          value={overallScore}
          onChange={(event) => setOverallScore(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inspector-note">Inspector summary</Label>
        <Textarea
          id="inspector-note"
          value={inspectorNote}
          onChange={(event) => setInspectorNote(event.target.value)}
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
        disabled={
          isPending || findings.some((finding) => !finding.label.trim())
        }
      >
        {isPending ? "Submitting..." : "Submit inspection report"}
      </Button>
    </form>
  );
}
