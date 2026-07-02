import Image from "next/image";
import Link from "next/link";
import { Lock, MapPin, ShieldCheck } from "lucide-react";
import type { PublicListingCardDto } from "@auto-iq/contracts/catalogue";
import type { BodyType } from "@auto-iq/contracts/enums";
import { SaveVehicleButton } from "@/components/marketplace/save-vehicle-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { formatPrice } from "@/lib/format";
import { labelizeEnum, mapBodyType, relativeListingAge } from "@/lib/vehicle-ui";

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
  /** True when the viewer is signed in. Controls the contact CTA copy. */
  signedIn?: boolean;
  slug?: string;
  /** Optional href to return to after viewing the detail page (preserves list filters). */
  returnHref?: string;
  /** True when this listing is already saved by the current buyer. */
  savedInitial?: boolean;
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
  bisellVerified,
  coverImageUrl,
  daysListed,
  negotiable,
  signedIn,
  returnHref,
  savedInitial = false,
}: VehicleCardProps) {
  const bodyTone = normalizeBodyType(bodyType);
  const baseHref = `/vehicles/${slug ?? id ?? ""}`;
  const href = returnHref ? `${baseHref}?return=${encodeURIComponent(returnHref)}` : baseHref;
  const listingAge = relativeListingAge(daysListed ?? 0);
  const priceUsd = askPriceUsd ?? price ?? 0;
  const verified = bisellVerified ?? false;
  const cityLabel = city ?? location ?? null;
  const score = inspectionScore ?? null;
  const bodyLabel = labelizeEnum(bodyType);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--ink-100)] bg-white shadow-[0_18px_45px_-30px_rgba(22,31,58,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-30px_rgba(22,31,58,0.4)]">
      {/* Save button sits outside the anchor so its click doesn't navigate */}
      <div className="absolute right-3 top-3 z-10">
        <SaveVehicleButton
          listingId={id ?? slug ?? ""}
          listingSlugOrId={slug ?? id}
          signedIn={Boolean(signedIn)}
          initialSaved={savedInitial}
          variant="ghost"
          size="icon"
          iconOnly
          className="h-9 w-9 rounded-full bg-white/85 text-[var(--ink-900)] shadow-[0_10px_25px_-15px_rgba(22,31,58,0.5)] hover:bg-white"
        />
      </div>

      <Link href={href} className="block focus-visible:outline-none">
        <div className="relative h-44 overflow-hidden bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)]">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={`${year} ${make} ${model}`}
              fill
              sizes="(min-width: 1280px) 22rem, (min-width: 768px) 32vw, 100vw"
              className="object-cover transition group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <CarSilhouette type={bodyTone} width={210} shadow={false} />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {verified ? (
              <Badge
                variant="success"
                className="bg-emerald-600/95 text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.55)]"
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : null}
            {score !== null ? (
              <Badge
                variant="amber"
                className="bg-[var(--amber)] text-[var(--ink-900)] shadow-[0_8px_20px_-8px_rgba(214,155,29,0.55)]"
              >
                Score {score}
              </Badge>
            ) : null}
          </div>

          {listingAge ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur">
              {listingAge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-400)]">
            <span>{year}</span>
            <span className="rounded-full bg-[var(--ink-50)] px-2 py-0.5 text-[10px] text-[var(--ink-500)]">
              {bodyLabel}
            </span>
          </div>
          <Link
            href={href}
            className="display block text-lg leading-tight text-[var(--ink-900)] transition hover:text-[var(--amber-dark)] focus-visible:outline-none focus-visible:underline"
          >
            {make} {model}
          </Link>
        </div>

        <div className="mt-1 flex items-baseline justify-between gap-3">
          <div>
            <p className="display text-2xl text-[var(--ink-900)]">{formatPrice(priceUsd, "USD")}</p>
            <p className="text-[11px] text-[var(--ink-400)]">
              {negotiable ? "Negotiable" : "Fixed price"}
            </p>
          </div>
          {cityLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ink-50)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-700)]">
              <MapPin className="h-3 w-3 text-[var(--amber-dark)]" aria-hidden="true" />
              {cityLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={href}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "flex-1 justify-center",
            })}
          >
            View
          </Link>
          {signedIn ? (
            <Link
              href={`${href}#contact`}
              className={buttonVariants({
                variant: "amber",
                size: "sm",
                className: "flex-1 justify-center",
              })}
            >
              Contact
            </Link>
          ) : (
            <Link
              href={`/auth/login?next=${encodeURIComponent(baseHref)}`}
              className={buttonVariants({
                variant: "amber",
                size: "sm",
                className: "flex-1 justify-center",
              })}
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
