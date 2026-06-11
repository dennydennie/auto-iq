import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-[var(--ink-900)] text-[#FFF8E7] shadow-[0_18px_40px_-18px_rgba(22,31,58,0.5)] hover:bg-[var(--ink-800)]",
  secondary: "bg-[var(--ink-50)] text-[var(--ink-900)] hover:bg-[var(--ink-100)]",
  outline: "border border-[var(--ink-200)] bg-white text-[var(--ink-900)] hover:bg-[var(--ink-50)]",
  ghost: "text-[var(--ink-900)] hover:bg-[var(--ink-50)]",
  amber: "bg-[#FFC72C] text-[var(--ink-900)] shadow-[0_18px_40px_-18px_rgba(214,155,29,0.45)] hover:bg-[#f1bc25]",
  destructive: "bg-[#C2410C] text-white hover:bg-[#9A3412]",
} as const;

const sizeClasses = {
  default: "h-11 px-5 py-2.5",
  sm: "h-9 rounded-md px-3.5 text-xs",
  lg: "h-12 rounded-xl px-6 text-sm",
  icon: "h-11 w-11",
} as const;

type ButtonVariant = keyof typeof variantClasses;
type ButtonSize = keyof typeof sizeClasses;

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC72C]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);

Button.displayName = "Button";
