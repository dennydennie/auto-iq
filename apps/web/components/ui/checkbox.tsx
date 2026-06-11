import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, ...props }, ref) => (
    <label className={cn("flex items-start gap-3 text-sm text-[var(--ink-500)]", className)}>
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--ink-200)] bg-white">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md"
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 rounded-md border-2 border-transparent peer-checked:border-[#FFC72C] peer-checked:bg-[var(--ink-900)]" />
        <Check className="pointer-events-none relative z-10 h-3.5 w-3.5 text-[#FFC72C] opacity-0 transition peer-checked:opacity-100" />
      </span>
      {label ? <span className="leading-6">{label}</span> : null}
    </label>
  ),
);

Checkbox.displayName = "Checkbox";
