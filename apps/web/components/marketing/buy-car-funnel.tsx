import Link from "next/link";
import type { PublicListingCardDto } from "@auto-iq/contracts/catalogue";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CircleDollarSign,
  ClipboardCheck,
  LayoutGrid,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ProcessStep,
  SectionIntro,
  TrustItem,
} from "@/components/marketing/funnel-primitives";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { buttonVariants } from "@/components/ui/button";

const CATEGORIES = [
  { label: "All vehicles", href: "/vehicles", icon: LayoutGrid },
  { label: "SUV", href: "/vehicles?bodyType=SUV", icon: CarFront },
  { label: "Bakkie", href: "/vehicles?bodyType=BAKKIE", icon: CarFront },
  { label: "Sedan", href: "/vehicles?bodyType=SEDAN", icon: CarFront },
  { label: "Hatch", href: "/vehicles?bodyType=HATCH", icon: CarFront },
  { label: "Verified", href: "/vehicles?verified=true", icon: BadgeCheck },
] as const;

const BUDGETS = [
  { label: "Under $10k", href: "/vehicles?priceMax=10000" },
  { label: "$10k–$20k", href: "/vehicles?priceMin=10000&priceMax=20000" },
  { label: "$20k and above", href: "/vehicles?priceMin=20000" },
] as const;

const TRUST_ITEMS = [
  {
    icon: ClipboardCheck,
    title: "Inspection context",
    description:
      "Review available condition and inspection details before you enquire.",
  },
  {
    icon: ShieldCheck,
    title: "Verified sellers",
    description:
      "Use clear verification signals to compare marketplace listings.",
  },
  {
    icon: LockKeyhole,
    title: "Protected contact",
    description: "Keep quote and viewing requests inside your Auto IQ account.",
  },
] as const;

function CategoryRail() {
  return (
    <nav
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      aria-label="Browse by vehicle type"
    >
      {CATEGORIES.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="group flex min-h-16 items-center justify-center gap-2 rounded-xl bg-[var(--ink-900)] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ink-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2"
        >
          <Icon
            className="h-5 w-5 text-[var(--amber)] transition group-hover:scale-105"
            aria-hidden="true"
          />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SearchPanel() {
  return (
    <form
      action="/vehicles"
      className="mt-3 grid gap-3 rounded-2xl bg-white p-3 shadow-[0_20px_50px_-35px_rgba(10,30,77,0.6)] md:grid-cols-[1fr_1fr_auto]"
    >
      <label className="relative block">
        <span className="sr-only">Vehicle make</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]"
          aria-hidden="true"
        />
        <input
          name="make"
          placeholder="Search make, for example Toyota"
          className="h-12 w-full rounded-xl border border-[var(--ink-200)] bg-white pl-11 pr-4 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--amber-dark)] focus:ring-2 focus:ring-[var(--amber)]/25"
        />
      </label>
      <label className="relative block">
        <span className="sr-only">City</span>
        <MapPin
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]"
          aria-hidden="true"
        />
        <input
          name="city"
          placeholder="City, for example Harare"
          className="h-12 w-full rounded-xl border border-[var(--ink-200)] bg-white pl-11 pr-4 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--amber-dark)] focus:ring-2 focus:ring-[var(--amber)]/25"
        />
      </label>
      <button
        className={buttonVariants({ variant: "amber", className: "h-12 px-7" })}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Search cars
      </button>
    </form>
  );
}

function BudgetLinks() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
      <span className="inline-flex items-center gap-2 font-semibold text-white">
        <CircleDollarSign
          className="h-4 w-4 text-[var(--amber)]"
          aria-hidden="true"
        />{" "}
        Shop by budget
      </span>
      {BUDGETS.map((budget) => (
        <Link
          key={budget.label}
          href={budget.href}
          className="rounded-full border border-white/20 px-3 py-1.5 transition hover:border-[var(--amber)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
        >
          {budget.label}
        </Link>
      ))}
    </div>
  );
}

function BuyHero() {
  return (
    <section className="bg-[linear-gradient(180deg,#f7f8fb_0%,#eef1f7_100%)] px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
          Buy a car
        </p>
        <h1 className="display mt-3 max-w-4xl text-4xl leading-[1.05] text-[var(--ink-900)] sm:text-5xl lg:text-6xl">
          Find your next car with the facts up front.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-500)]">
          Search inspected marketplace listings, compare seller trust signals,
          and keep every viewing or quote request in one secure place.
        </p>
        <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(145deg,#18233e_0%,#0a1e4d_100%)] p-4 shadow-[0_30px_80px_-45px_rgba(10,30,77,0.85)] sm:p-5">
          <CategoryRail />
          <SearchPanel />
          <BudgetLinks />
        </div>
      </div>
    </section>
  );
}

function VehiclePreview({ listings, signedIn }: BuyCarFunnelProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionIntro
          eyebrow="Fresh inventory"
          title="Latest vehicles"
          description="Start with the newest published listings, then open the complete catalogue when you are ready to narrow the search."
        />
        <Link
          href="/vehicles"
          className={buttonVariants({
            variant: "outline",
            className: "shrink-0",
          })}
        >
          Browse all vehicles <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {listings.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {listings.map((listing) => (
            <VehicleCard key={listing.id} {...listing} signedIn={signedIn} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-[var(--ink-200)] bg-white px-6 py-10 text-center">
          <Sparkles
            className="mx-auto h-7 w-7 text-[var(--amber-dark)]"
            aria-hidden="true"
          />
          <h3 className="mt-3 text-lg font-semibold text-[var(--ink-900)]">
            No vehicles are published yet
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--ink-500)]">
            The catalogue is ready for new listings. Check again soon or create
            a seller listing to add the first vehicle.
          </p>
          <Link
            href="/sell-my-car"
            className={buttonVariants({ variant: "amber", className: "mt-5" })}
          >
            Sell a car
          </Link>
        </div>
      )}
    </section>
  );
}

function BuyerGuide() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Simple by design"
          title="From search to viewing in three clear steps"
          description="Auto IQ keeps the buying journey structured so you can focus on the vehicle, not scattered messages."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ProcessStep
            number="1"
            title="Browse and filter"
            description="Search by make, city, body type, year, mileage, price, and verification status."
          />
          <ProcessStep
            number="2"
            title="Compare the facts"
            description="Review photos, pricing, seller signals, and any available inspection summary."
          />
          <ProcessStep
            number="3"
            title="Request the next step"
            description="Sign in to request a quote or viewing and keep the conversation tied to the listing."
          />
        </div>
      </div>
    </section>
  );
}

export type BuyCarFunnelProps = {
  listings: PublicListingCardDto[];
  signedIn: boolean;
};

export function BuyCarFunnel(props: BuyCarFunnelProps) {
  return (
    <main>
      <BuyHero />
      <section className="bg-[var(--ink-900)] px-4 py-5 sm:px-6 lg:px-8">
        <ul className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <TrustItem key={item.title} {...item} />
          ))}
        </ul>
      </section>
      <VehiclePreview {...props} />
      <BuyerGuide />
    </main>
  );
}
