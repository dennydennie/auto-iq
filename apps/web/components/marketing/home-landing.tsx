import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { PageContainer } from "@/components/shared/page-container";
import { SiteFooter } from "@/components/shared/site-footer";
import {
  VehicleSearchForm,
  type VehicleSearchOptions,
} from "@/components/marketplace/vehicle-search-form";
import { buttonVariants } from "@/components/ui/button";

const HERO_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCAyNCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiBmaWxsPSIjMTAxYTM4Ii8+PHBhdGggZD0iTTAgMjQgNDAgNHYyMHoiIGZpbGw9IiMyNzM1NmEiLz48L3N2Zz4=";

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: "Verified signals",
    body: "See the trust context before you make contact.",
  },
  {
    icon: ClipboardCheck,
    title: "Inspection context",
    body: "Make decisions with structured vehicle information.",
  },
  {
    icon: ShieldCheck,
    title: "Protected requests",
    body: "Keep quotes and viewings organised in one place.",
  },
] as const;

const MOVE_OPTIONS = [
  {
    icon: CarFront,
    title: "I want to buy",
    body: "Browse vehicles, compare the facts, and request a viewing.",
    href: "/buy-a-car",
    label: "Browse vehicles",
  },
  {
    icon: WalletCards,
    title: "I want to sell",
    body: "Create a structured listing and move through review with confidence.",
    href: "/sell-my-car",
    label: "Sell my car",
  },
] as const;

const PROOF_ITEMS = [
  {
    icon: ShieldCheck,
    title: "One protected account",
    body: "Keep saved vehicles, quotes, requests, and viewings together.",
  },
  {
    icon: ClipboardCheck,
    title: "Facts before contact",
    body: "See price, location, seller, and inspection context before you engage.",
  },
  {
    icon: BadgeCheck,
    title: "Clear trust signals",
    body: "Compare listing verification signals with consistent information across the marketplace.",
  },
  {
    icon: MapPin,
    title: "Built for Zimbabwe",
    body: "Search by make, model, city, and the filters that matter locally.",
  },
] as const;

const SELLER_BODY_TYPES = ["SUV", "Bakkie", "Sedan", "Hatch"] as const;

function HeroVehiclePhoto() {
  return (
    <div className="relative mx-auto h-[280px] w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#081638] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] sm:h-[360px] lg:h-[410px]">
      <Image
        src="/images/honda-vezel-hero.jpg"
        alt="Honda Vezel Hybrid photographed at a motor show"
        fill
        priority
        placeholder="blur"
        blurDataURL={HERO_BLUR}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#051438]/65 via-transparent to-transparent"
        aria-hidden="true"
      />
      <p className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#051438]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
        Honda Vezel
      </p>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="bg-[var(--ink-900)] py-5">
      <PageContainer as="ul" className="grid gap-3 md:grid-cols-3">
        {TRUST_ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <Icon
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm leading-5 text-white/65">{body}</p>
            </div>
          </li>
        ))}
      </PageContainer>
    </section>
  );
}

function MoveOptions() {
  return (
    <PageContainer as="section" className="py-[var(--section-space)]">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
          Start here
        </p>
        <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
          What are you looking to do?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-500)] sm:text-base">
          Choose the journey that fits your next move. Auto IQ keeps the
          important details clear from first search to final handover.
        </p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {MOVE_OPTIONS.map(({ icon: Icon, title, body, href, label }) => (
          <article
            key={title}
            className="group rounded-[var(--radius-card)] border border-[var(--ink-100)] bg-white p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-42px_rgba(10,30,77,0.7)] sm:p-8"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--amber-soft)] text-[var(--ink-900)]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="display mt-6 text-2xl text-[var(--ink-900)]">
              {title}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-500)]">
              {body}
            </p>
            <Link
              href={href}
              className={buttonVariants({
                variant: "outline",
                className: "mt-6",
              })}
            >
              {label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}

function HowItWorks() {
  const steps = [
    [
      "01",
      "Browse the marketplace",
      "Use make, location, body type, year, price, and verified filters to narrow the field.",
    ],
    [
      "02",
      "Understand the vehicle",
      "Review photos, pricing, seller information, and inspection context before you engage.",
    ],
    [
      "03",
      "Take the next step",
      "Request a quote or viewing and keep the conversation tied to the vehicle you care about.",
    ],
  ];
  return (
    <section className="bg-white py-[var(--section-space)]">
      <PageContainer>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
              Simple by design
            </p>
            <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
              From first search to a confident decision.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-500)] sm:text-base">
            A clear marketplace experience for Zimbabwean buyers and sellers,
            with structured workflows behind every important step.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, body]) => (
            <article
              key={number}
              className="rounded-2xl border border-[var(--ink-100)] bg-[var(--paper)] p-5"
            >
              <span className="mono text-sm font-semibold text-[var(--amber-dark)]">
                {number}
              </span>
              <h3 className="mt-6 text-lg font-semibold text-[var(--ink-900)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

function ProofGrid() {
  return (
    <section className="bg-white py-[var(--section-space)]">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
            Why Auto IQ
          </p>
          <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
            A safer way to make your next move.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-500)] sm:text-base">
            The important details stay visible, so buyers and sellers can move
            forward with more confidence.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROOF_ITEMS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-[var(--radius-card)] border border-[var(--ink-100)] bg-[var(--paper)] p-5 shadow-[var(--shadow-card)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--amber-soft)] text-[var(--ink-900)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--ink-900)]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

function TrustJourney() {
  const signals = [
    "Verification status",
    "Inspection context",
    "Protected request",
  ];
  return (
    <section className="bg-[var(--paper)] py-[var(--section-space)]">
      <PageContainer>
        <div className="grid gap-8 rounded-[var(--radius-feature)] bg-[linear-gradient(135deg,#051438_0%,#0A1E4D_70%,#1D2944_100%)] p-7 text-white shadow-[0_30px_80px_-45px_rgba(5,20,56,0.8)] sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber)]">
              The Auto IQ difference
            </p>
            <h2 className="display mt-4 max-w-xl text-3xl leading-tight sm:text-5xl">
              Confidence comes with the vehicle.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              From the first shortlist to the viewing request, the journey keeps
              the evidence, updates, and next action in one place.
            </p>
            <Link
              href="/about"
              className={buttonVariants({
                variant: "amber",
                className: "mt-7",
              })}
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              A clear vehicle journey
            </p>
            <div className="mt-5 space-y-3">
              {signals.map((signal, index) => (
                <div
                  key={signal}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-[var(--ink-900)]">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{signal}</p>
                    <p className="mt-1 text-sm text-white/55">
                      Visible before your next action.
                    </p>
                  </div>
                  <CheckCircle2
                    className="h-5 w-5 text-[var(--amber)]"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function SellerCallout() {
  return (
    <section className="bg-white py-[var(--section-space)]">
      <PageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
            Ready to sell?
          </p>
          <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
            List your car with confidence.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-500)] sm:text-base">
            Create a complete listing, disclose the facts clearly, and manage
            buyer interest from one protected workspace.
          </p>
        </div>
        <div className="mt-10 overflow-hidden rounded-[var(--radius-feature)] border border-[var(--ink-100)] bg-[var(--ink-900)] shadow-[0_30px_70px_-45px_rgba(10,30,77,0.8)]">
          <div className="grid border-b border-white/10 text-sm font-semibold text-white/60 sm:grid-cols-3">
            {[
              "1. Vehicle details",
              "2. Condition and price",
              "3. Photos and review",
            ].map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-3 px-5 py-4 ${index === 0 ? "bg-white/10 text-white" : ""}`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-[var(--ink-900)]">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-white">
                What are you listing?
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SELLER_BODY_TYPES.map((type) => (
                  <div
                    key={type}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-5 text-center text-sm font-semibold text-white/85"
                  >
                    <CarFront
                      className="mx-auto mb-3 h-6 w-6 text-[var(--amber)]"
                      aria-hidden="true"
                    />
                    {type}
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/55">
                Start with the basics. You can add the full specification,
                photos, documents, and asking price in the seller workspace.
              </p>
            </div>
            <Link
              href="/sell-my-car"
              className={buttonVariants({
                variant: "amber",
                className: "shrink-0",
              })}
            >
              Start my listing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function HomeLanding({
  searchOptions,
}: {
  searchOptions: VehicleSearchOptions;
}) {
  return (
    <main>
      <section className="relative overflow-x-hidden bg-[linear-gradient(135deg,#051438_0%,#0A1E4D_56%,#18233E_100%)] pb-12 pt-12 text-white sm:pt-16">
        <div
          className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[var(--amber)]/10 blur-3xl"
          aria-hidden="true"
        />
        <PageContainer className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative z-20">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber)]">
              Zimbabwe&apos;s trust-first vehicle marketplace
            </p>
            <h1 className="display mt-6 max-w-3xl text-5xl leading-[0.94] sm:text-7xl">
              Your next car. Your next move.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Buy and sell vehicles with the facts up front, structured
              requests, and a clear path from search to handover.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sell-my-car"
                className={buttonVariants({
                  variant: "amber",
                  className: "px-6",
                })}
              >
                Sell my car <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/buy-a-car"
                className={buttonVariants({
                  variant: "default",
                  className:
                    "border border-white/20 bg-white/10 px-6 text-white hover:bg-white/15",
                })}
              >
                Buy a car <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <HeroVehiclePhoto />
        </PageContainer>
        <PageContainer size="content" className="relative z-20 mt-8">
          <VehicleSearchForm options={searchOptions} />
        </PageContainer>
      </section>
      <TrustStrip />
      <MoveOptions />
      <HowItWorks />
      <ProofGrid />
      <TrustJourney />
      <SellerCallout />
      <section className="bg-[var(--paper)] py-[var(--section-space)]">
        <PageContainer>
          <div className="flex flex-col gap-6 rounded-[var(--radius-feature)] bg-[var(--amber)] p-7 text-[var(--ink-900)] sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-900)]/65">
                Ready when you are
              </p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">
                Make your next move with Auto IQ.
              </h2>
            </div>
            <Link
              href="/vehicles"
              className={buttonVariants({
                variant: "default",
                className: "shrink-0",
              })}
            >
              Browse vehicles <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
