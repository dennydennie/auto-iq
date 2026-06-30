import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, MapPin, ShieldCheck } from "lucide-react";
import type { PublicListingCardDto } from "@auto-iq/contracts/catalogue";
import type { BodyType } from "@auto-iq/contracts/enums";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { SaveVehicleButton } from "@/components/marketplace/save-vehicle-button";
import { formatPrice } from "@/lib/format";
import { mapBodyType, relativeListingAge } from "@/lib/vehicle-ui";

type LegacyBodyType = "bakkie" | "hatch" | "sedan" | "suv";

type VehicleCardProps = Pick<
  PublicListingCardDto,
  "year" | "make" | "model"
> & {
  askPriceUsd?: number;
  bisellVerified?: boolean;
  bodyType: BodyType | LegacyBodyType;
  city?: string;
  coverImageUrl?: string | null;
  daysListed?: number;
  id?: string;
  inspectionScore?: number | null;
  location?: string;
  negotiable?: boolean;
  price?: number;
  score?: number;
  slug?: string;
  signedIn?: boolean;
};

function normalizeBodyType(bodyType: BodyType | LegacyBodyType) {
  switch (bodyType) {
    case "bakkie":
    case "hatch":
    case "sedan":
    case "suv":
      return bodyType;
    default:
      return mapBodyType(bodyType);
  }
}

export function VehicleCard({
  id,
  slug,
  year,
  make,
  model,
  bodyType,
  city,
  location,
  askPriceUsd,
  price,
  inspectionScore,
  score,
  bisellVerified,
  coverImageUrl,
  daysListed,
  negotiable,
  signedIn,
}: VehicleCardProps) {
  const bodyTone = normalizeBodyType(bodyType);
  const href = `/vehicles/${slug ?? id ?? ""}`;
  const listingAge = relativeListingAge(daysListed ?? 0);
  const priceUsd = askPriceUsd ?? price ?? 0;
  const scoreValue = inspectionScore ?? score ?? null;
  const verified = bisellVerified ?? false;
  const cityLabel = city ?? location ?? "Location unavailable";

  return (
    <Card className="overflow-hidden">
      <div className="relative overflow-hidden rounded-t-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,205,83,0.18),transparent_40%),linear-gradient(180deg,#18233e_0%,#0f1830_100%)] px-5 py-7">
        <div className="absolute right-4 top-4">
          {signedIn && id ? (
            <SaveVehicleButton compact listingId={id} />
          ) : (
            <Link
              href={`/auth/login?next=${encodeURIComponent(href)}`}
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "rounded-full bg-white/8 text-white hover:bg-white/16",
              })}
              aria-label={`Sign in to save ${year} ${make} ${model}`}
            >
              <Heart className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="mx-auto flex h-36 max-w-[16rem] items-center justify-center overflow-hidden rounded-[1.25rem]">
          {coverImageUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={coverImageUrl}
                alt={`${year} ${make} ${model}`}
                fill
                unoptimized
                sizes="(min-width: 1280px) 16rem, (min-width: 768px) 18rem, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <CarSilhouette type={bodyTone} width={250} shadow={false} />
          )}
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-500)]">{year}</p>
            <h3 className="display mt-2 text-xl text-[var(--ink-900)]">
              {make} {model}
            </h3>
          </div>
          {scoreValue !== null ? (
            <ScoreGauge score={scoreValue} size={64} ariaLabel={`${year} ${make} ${model} inspection score ${scoreValue} out of 100`} />
          ) : (
            <Badge variant="outline">No score yet</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            {cityLabel}
          </Badge>
          <Badge variant="outline">
            {listingAge}
          </Badge>
          {verified ? (
            <Badge variant="success">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Verified
            </Badge>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="display text-2xl text-[var(--ink-900)]">{formatPrice(priceUsd, "USD")}</p>
          <p className="text-sm text-[var(--ink-500)]">
            {negotiable ? "Negotiable listing" : "Fixed seller price"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-5">
        <p className="text-sm text-[var(--ink-500)]">
          {scoreValue !== null ? `AutoIQ score ${scoreValue}/100` : "Awaiting buyer-safe inspection summary"}
        </p>
        <Link
          href={href}
          className={buttonVariants({ variant: "amber", size: "sm" })}
        >
          View details
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
