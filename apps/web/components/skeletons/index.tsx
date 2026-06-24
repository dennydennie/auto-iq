import { Skeleton } from "@/components/shared/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-6 h-52 w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </main>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

export function AvatarSkeleton() {
  return <Skeleton className="h-12 w-12 rounded-full" />;
}

export function DashboardPageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-5 h-12 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="mt-8 grid gap-4">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </main>
  );
}
