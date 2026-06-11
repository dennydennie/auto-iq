import Link from "next/link";
import { AlertTriangle, Calendar, Eye, MessageSquare, PenSquare } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/format";

export function SellerListingCard({
  href,
  id,
  year,
  make,
  model,
  price,
  status,
  bodyType,
  views,
  viewings,
  quotes,
  note,
}: {
  href: string;
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  status: Parameters<typeof StatusBadge>[0]["status"];
  bodyType: Parameters<typeof CarSilhouette>[0]["type"];
  views: number;
  viewings: number;
  quotes: number;
  note?: string | null;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 p-5 md:grid-cols-[9rem_1fr_auto] md:items-center">
        <div className="flex h-28 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)]">
          <CarSilhouette type={bodyType} width={180} shadow={false} />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <Badge variant="outline">{id}</Badge>
          </div>
          <div>
            <h3 className="display text-2xl text-[var(--ink-900)]">
              {year} {make} {model}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-500)]">{formatPrice(price, "USD")}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--ink-500)]">
            <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> {views} views</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {viewings} viewings</span>
            <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {quotes} quotes</span>
          </div>
        </div>
        <div className="flex items-center md:justify-end">
          <Link href={href} className={buttonVariants({ variant: "outline" })}>
            <PenSquare className="h-4 w-4" />
            Open listing
          </Link>
        </div>
      </CardContent>
      {note ? (
        <CardFooter className="border-t border-amber-200 bg-amber-50/80 px-5 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>{note}</span>
        </CardFooter>
      ) : null}
    </Card>
  );
}
