import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-[var(--ink-200)] bg-white px-3.5 text-sm text-[var(--ink-900)] shadow-sm outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--ink-900)] focus:ring-2 focus:ring-[var(--amber)]/35 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
