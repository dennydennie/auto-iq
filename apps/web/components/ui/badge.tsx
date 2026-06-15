import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-[var(--ink-50)] text-[var(--ink-900)]",
  outline: "border border-[var(--ink-200)] bg-transparent text-[var(--ink-900)]",
  amber: "bg-[var(--amber-soft)] text-[var(--ink-900)]",
  success: "bg-[var(--verified-soft)] text-[var(--verified)]",
  warning: "bg-[var(--pending-soft)] text-[var(--pending)]",
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
