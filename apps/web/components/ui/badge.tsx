import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-[var(--ink-50)] text-[var(--ink-900)]",
  outline: "border border-[var(--ink-200)] bg-transparent text-[var(--ink-900)]",
  amber: "bg-[#FFF1B8] text-[var(--ink-900)]",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
} as const;

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: keyof typeof badgeVariants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
