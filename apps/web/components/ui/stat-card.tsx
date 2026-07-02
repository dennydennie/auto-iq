import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTrend = {
  /** Signed percentage or delta value, e.g. 12 or -3. */
  delta: number;
  /** Human-readable period descriptor, e.g. "vs last 7 days". */
  period: string;
  /** Optional custom formatter for the delta (defaults to "+12%" / "-3%"). */
  formatDelta?: (value: number) => string;
};

export type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Period over which the value applies (e.g. "Last 24 hours"). */
  period?: string;
  /** Optional trend indicator. Omit when the backend does not yet expose period deltas. */
  trend?: StatCardTrend;
  className?: string;
};

function defaultFormatDelta(value: number) {
  if (value === 0) return "0%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}%`;
}

function trendTone(delta: number) {
  if (delta > 0) return "text-emerald-600";
  if (delta < 0) return "text-[var(--reject,#dc2626)]";
  return "text-[var(--ink-500)]";
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />;
  if (delta < 0) return <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />;
  return <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />;
}

export function StatCard({ label, value, icon: Icon, period, trend, className }: StatCardProps) {
  const formatDelta = trend?.formatDelta ?? defaultFormatDelta;

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-400)]">{label}</p>
          {Icon ? (
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--amber-dark)]"
            >
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        <p className="display mt-3 text-3xl text-[var(--ink-900)]">{value}</p>
        {trend ? (
          <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", trendTone(trend.delta))}>
            <TrendIcon delta={trend.delta} />
            <span>{formatDelta(trend.delta)}</span>
            <span className="font-normal text-[var(--ink-400)]">· {trend.period}</span>
          </div>
        ) : period ? (
          <p className="mt-3 text-xs text-[var(--ink-400)]">{period}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
