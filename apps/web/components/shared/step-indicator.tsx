import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StepIndicator({
  currentStep,
  totalSteps,
  label,
}: {
  currentStep: number;
  totalSteps: number;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--amber-dark)]">
        <span>{label}</span>
        <span>{currentStep} / {totalSteps}</span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full bg-[var(--ink-100)]",
              index < currentStep && "bg-[var(--ink-900)]",
            )}
          />
        ))}
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="sr-only" />
    </div>
  );
}
