import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-[var(--ink-200)] bg-white px-3.5 py-3 text-sm text-[var(--ink-900)] shadow-sm outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[#FFC72C]/35 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
