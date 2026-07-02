import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Compact workspace-style page header.
 *
 * Use for signed-in dashboards, list pages, and form pages where users return
 * repeatedly — the greeting should not dominate the fold. For public
 * marketing-style landing sections use a bespoke hero instead.
 *
 * Design rules (kept small on purpose):
 *   - h1 stays at text-2xl / lg:text-3xl. No larger.
 *   - Description caps at one to two lines.
 *   - Primary action sits inline on the right at md+, stacks below on mobile.
 *   - No card shell around it — sits directly in the page flow.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  breadcrumb,
  className,
}: {
  /** Small uppercase pill above the title. Omit for pages that already have a breadcrumb. */
  eyebrow?: string;
  title: string;
  /** One or two lines. Longer copy belongs in the page body, not the header. */
  description?: ReactNode;
  /** Primary and secondary action buttons. */
  actions?: ReactNode;
  /** Right-side meta content (e.g. status pill, count, updated-at). Ignored when actions is set. */
  meta?: ReactNode;
  /** Breadcrumb rendered above the header row. */
  breadcrumb?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumb}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <Badge variant="outline" className="w-fit">
              {eyebrow}
            </Badge>
          ) : null}
          <h1 className="display text-2xl leading-tight text-[var(--ink-900)] lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[var(--ink-500)]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : meta ? (
          <div className="shrink-0">{meta}</div>
        ) : null}
      </div>
    </header>
  );
}
