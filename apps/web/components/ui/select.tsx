import * as React from "react";
import { cn } from "@/lib/utils";

export const selectClassName =
  "flex min-h-11 w-full rounded-xl border border-[var(--ink-200)] bg-white px-3.5 text-sm text-[var(--ink-900)] shadow-sm outline-none transition focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[var(--amber)]/35 disabled:cursor-not-allowed disabled:opacity-50";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(selectClassName, className)}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
