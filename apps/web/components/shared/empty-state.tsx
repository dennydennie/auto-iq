import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  headline,
  body,
  cta,
}: {
  icon: LucideIcon;
  headline: string;
  body: string;
  cta?: { label: string; href: string };
  children?: ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--ink-900)]">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="display text-2xl text-[var(--ink-900)]">{headline}</h3>
          <p className="mx-auto max-w-md text-sm leading-6 text-[var(--ink-500)]">{body}</p>
        </div>
        {cta ? (
          <Link href={cta.href} className={buttonVariants({ variant: "amber" })}>
            {cta.label}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
