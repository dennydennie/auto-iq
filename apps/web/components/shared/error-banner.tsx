import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorBanner({
  message,
  correlationId,
  className,
}: {
  message: string;
  correlationId?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div className="space-y-1">
        <p className="font-medium">{message}</p>
        {correlationId ? (
          <p className="text-xs text-amber-800/80">Reference: {correlationId}</p>
        ) : null}
      </div>
    </div>
  );
}
