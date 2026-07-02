import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export type PaginationFooterProps = {
  /** 1-indexed current page. */
  page: number;
  /** Total number of pages (>= 1). */
  totalPages: number;
  /** Items per page. */
  limit: number;
  /** Total number of items across all pages. */
  total: number;
  /** Builder that returns the href for a given page number. */
  buildHref: (page: number) => string;
  className?: string;
};

export function PaginationFooter({
  page,
  totalPages,
  limit,
  total,
  buildHref,
  className,
}: PaginationFooterProps) {
  const safePage = Math.max(1, Math.min(page, Math.max(1, totalPages)));
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = Math.min(total, safePage * limit);
  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;

  return (
    <div
      className={`flex flex-col gap-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white px-5 py-4 text-sm text-[var(--ink-500)] sm:flex-row sm:items-center sm:justify-between ${
        className ?? ""
      }`}
    >
      <p>
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-semibold text-[var(--ink-900)]">{start}</span>–
            <span className="font-semibold text-[var(--ink-900)]">{end}</span> of{" "}
            <span className="font-semibold text-[var(--ink-900)]">{total}</span> results
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">
          Page {safePage} of {Math.max(1, totalPages)}
        </span>
        <div className="flex gap-2">
          <Link
            href={prevDisabled ? "#" : buildHref(safePage - 1)}
            aria-disabled={prevDisabled}
            tabIndex={prevDisabled ? -1 : 0}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: prevDisabled ? "pointer-events-none opacity-50" : "",
            })}
          >
            Previous
          </Link>
          <Link
            href={nextDisabled ? "#" : buildHref(safePage + 1)}
            aria-disabled={nextDisabled}
            tabIndex={nextDisabled ? -1 : 0}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: nextDisabled ? "pointer-events-none opacity-50" : "",
            })}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
