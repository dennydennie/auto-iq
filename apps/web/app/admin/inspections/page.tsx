import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminInspectionsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Inspections"
        title="Vehicle inspections"
        description="Inspection state is managed from the listing record itself — there is no standalone inspection detail endpoint yet."
      />

      <Card>
        <CardHeader>
          <CardTitle>Where to manage inspections today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-[var(--ink-500)]">
          <p>
            Open a listing from the moderation queue. The inspection sidebar exposes the
            assigned task, the score gauge, and the buyer-summary approval action.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/listings?status=INSPECTION_PENDING"
              className={buttonVariants({ variant: "amber" })}
            >
              <ShieldCheck className="h-4 w-4" />
              See inspection-pending listings
            </Link>
            <Link
              href="/admin/listings?status=APPROVED"
              className={buttonVariants({ variant: "outline" })}
            >
              Awaiting summary approval
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
