"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCw } from "lucide-react";
import { PageContainer } from "@/components/shared/page-container";
import { Button, buttonVariants } from "@/components/ui/button";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[route error]", error);
  }, [error]);

  return (
    <PageContainer
      as="main"
      size="narrow"
      className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--amber-soft)] text-[var(--amber-dark)]">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="display mt-6 text-3xl text-[var(--ink-900)]">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-500)]">
        The page couldn&apos;t finish loading. This has been logged. Try again,
        or head back to the catalogue.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-[var(--ink-400)]">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset} variant="amber">
          <RotateCw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to catalogue
        </Link>
      </div>
    </PageContainer>
  );
}
