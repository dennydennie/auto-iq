export function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-[var(--ink-200)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-500)] shadow-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#FFC72C]" />
        {label}
      </div>
    </div>
  );
}
