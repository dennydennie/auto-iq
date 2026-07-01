import Link from "next/link";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export type FilterChip = {
  label: string;
  removeHref: string;
};

export function FilterChips({
  chips,
  clearAllHref,
}: {
  chips: FilterChip[];
  clearAllHref: string;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-400)]">
        Filtered by
      </span>
      {chips.map((chip) => (
        <Link
          key={`${chip.label}-${chip.removeHref}`}
          href={chip.removeHref}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink-900)] shadow-sm transition hover:bg-[var(--ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
        >
          {chip.label}
          <X className="h-3 w-3 text-[var(--ink-400)]" aria-hidden="true" />
        </Link>
      ))}
      <Link
        href={clearAllHref}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 px-2 text-xs" })}
      >
        Clear all
      </Link>
    </div>
  );
}
