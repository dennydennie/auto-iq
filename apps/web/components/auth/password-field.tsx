"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Kept in sync with the API's password policy. If the backend loosens/tightens
// this, update here so the strength meter doesn't lie.
const MIN_LENGTH = 8;

export type PasswordStrength = "empty" | "weak" | "fair" | "strong";

export function assessPassword(value: string): PasswordStrength {
  if (value.length === 0) return "empty";
  if (value.length < MIN_LENGTH) return "weak";

  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  if (classes >= 3 && value.length >= 12) return "strong";
  if (classes >= 2) return "fair";
  return "weak";
}

const TONE: Record<Exclude<PasswordStrength, "empty">, { label: string; barTone: string; textTone: string }> = {
  weak: {
    label: "Too weak",
    barTone: "bg-[var(--reject)]",
    textTone: "text-[var(--reject)]",
  },
  fair: {
    label: "Fair",
    barTone: "bg-[var(--amber)]",
    textTone: "text-[var(--amber-dark)]",
  },
  strong: {
    label: "Strong",
    barTone: "bg-emerald-600",
    textTone: "text-emerald-700",
  },
};

const BAR_WIDTH: Record<PasswordStrength, string> = {
  empty: "w-0",
  weak: "w-1/3",
  fair: "w-2/3",
  strong: "w-full",
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "new-password",
  placeholder,
  showStrength = false,
  invalid = false,
  requirementHint = `At least ${MIN_LENGTH} characters, mix of letters and numbers.`,
  name,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  showStrength?: boolean;
  invalid?: boolean;
  requirementHint?: string;
  name?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [visible, setVisible] = useState(false);
  const strength = assessPassword(value);
  const strengthMeta = strength === "empty" ? null : TONE[strength];

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
        <Input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid}
          aria-describedby={`${inputId}-help`}
          minLength={MIN_LENGTH}
          className="h-12 rounded-2xl border-[var(--ink-300)] bg-[var(--ink-50)]/55 pl-11 pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // 44×44 hit target for mobile.
          className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-white hover:text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength ? (
        <div className="space-y-1.5" aria-live="polite">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ink-100)]"
            role="progressbar"
            aria-valuenow={strength === "strong" ? 100 : strength === "fair" ? 66 : strength === "weak" ? 33 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Password strength"
          >
            <div
              className={cn("h-full rounded-full transition-all", BAR_WIDTH[strength], strengthMeta?.barTone)}
            />
          </div>
          <p id={`${inputId}-help`} className="text-xs leading-5 text-[var(--ink-400)]">
            {strengthMeta ? (
              <span className={strengthMeta.textTone}>Strength: {strengthMeta.label}. </span>
            ) : null}
            {requirementHint}
          </p>
        </div>
      ) : (
        <p id={`${inputId}-help`} className="text-xs leading-5 text-[var(--ink-400)]">
          {requirementHint}
        </p>
      )}
    </div>
  );
}
