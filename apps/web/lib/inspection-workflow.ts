import type {
  InspectionCategory,
  InspectionFindingRating,
} from "@auto-iq/contracts/enums";
import type { InspectionFindingInput } from "@auto-iq/contracts/inspections";

export const REQUIRED_INSPECTION_CHECKLIST: ReadonlyArray<{
  category: Exclude<InspectionCategory, "SUMMARY">;
  label: string;
}> = [
  { category: "ENGINE", label: "Engine and fluids" },
  { category: "ELECTRICAL", label: "Electrical systems" },
  { category: "BODY", label: "Body and structure" },
  { category: "TYRES", label: "Tyres and wheels" },
  { category: "BRAKES", label: "Brakes and steering" },
  { category: "INTERIOR", label: "Interior and controls" },
];

export function createInspectionFindings(): InspectionFindingInput[] {
  return REQUIRED_INSPECTION_CHECKLIST.map((item) => ({
    ...item,
    rating: "PASS",
    note: "",
  }));
}

export function inspectionScore(
  findings: ReadonlyArray<Pick<InspectionFindingInput, "rating">>,
) {
  const total = findings.reduce(
    (sum, finding) => sum + ratingScore(finding.rating),
    0,
  );
  return Math.round(total / findings.length);
}

function ratingScore(rating: InspectionFindingRating) {
  if (rating === "PASS") return 100;
  if (rating === "WATCH") return 65;
  return 20;
}
