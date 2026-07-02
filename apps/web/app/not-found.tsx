import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--amber-dark)]">
        <Compass className="h-7 w-7" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-400)]">
        404
      </p>
      <h1 className="display mt-2 text-3xl text-[var(--ink-900)]">Page not found</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-500)]">
        The link you followed may be broken, or the vehicle you&apos;re looking for might
        have been delisted.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className={buttonVariants({ variant: "amber" })}>
          Browse catalogue
        </Link>
        <Link href="/about" className={buttonVariants({ variant: "outline" })}>
          What is BiSell AutoIQ?
        </Link>
      </div>
    </main>
  );
}
