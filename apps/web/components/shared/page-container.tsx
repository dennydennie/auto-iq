import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

const WIDTHS = {
  wide: "max-w-[var(--container-wide)]",
  content: "max-w-[var(--container-content)]",
  narrow: "max-w-[var(--container-narrow)]",
} as const;

export function PageContainer({
  as: Component = "div",
  size = "wide",
  className,
  children,
}: {
  as?: ElementType;
  size?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        WIDTHS[size],
        className,
      )}
    >
      {children}
    </Component>
  );
}
