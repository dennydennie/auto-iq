import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CarFront,
  Check,
  ClipboardList,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Tags,
  Upload,
} from "lucide-react";
import {
  ProcessStep,
  SectionIntro,
} from "@/components/marketing/funnel-primitives";
import { buttonVariants } from "@/components/ui/button";

const SELL_STAGES = [
  { number: "1", label: "Vehicle details", icon: CarFront },
  { number: "2", label: "Condition and price", icon: Gauge },
  { number: "3", label: "Photos and review", icon: Camera },
] as const;

const BODY_TYPES = [
  { label: "Sedan", href: "/seller/listings/new?bodyType=SEDAN" },
  { label: "SUV", href: "/seller/listings/new?bodyType=SUV" },
  { label: "Bakkie", href: "/seller/listings/new?bodyType=BAKKIE" },
  { label: "Hatch", href: "/seller/listings/new?bodyType=HATCH" },
] as const;

const FAQS = [
  {
    question: "Does Auto IQ buy my vehicle directly?",
    answer:
      "No. Auto IQ helps you create and manage a structured marketplace listing. Buyers can then request quotes or viewings through the platform.",
  },
  {
    question: "When will my listing become public?",
    answer:
      "After you complete the required details, photos, documents, and submit the listing, the Auto IQ team reviews it before publication.",
  },
  {
    question: "Can I update the asking price later?",
    answer:
      "Yes. You can save a draft and update its vehicle details, condition disclosure, and asking price before submitting it for review.",
  },
  {
    question: "How do buyers contact me?",
    answer:
      "Buyer interest stays attached to the listing through protected quote and viewing workflows, helping you avoid untracked side conversations.",
  },
] as const;

function StageRail() {
  return (
    <ol className="grid overflow-hidden rounded-t-[1.5rem] border border-b-0 border-[var(--ink-100)] bg-white md:grid-cols-3">
      {SELL_STAGES.map(({ number, label, icon: Icon }, index) => (
        <li
          key={label}
          className="flex min-h-16 items-center gap-3 border-b border-[var(--ink-100)] px-5 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink-900)] text-xs font-bold text-[var(--amber)]">
            {number}
          </span>
          <Icon
            className="h-4 w-4 text-[var(--amber-dark)]"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-[var(--ink-900)]">
            {label}
          </span>
          {index === 0 ? <span className="sr-only">Current stage</span> : null}
        </li>
      ))}
    </ol>
  );
}

function BodyTypeLinks() {
  return (
    <div>
      <p className="text-sm font-semibold text-white">What are you listing?</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BODY_TYPES.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/15 bg-white/8 px-3 py-4 text-sm font-semibold text-white transition hover:border-[var(--amber)] hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
          >
            <CarFront
              className="mb-2 h-7 w-7 text-[var(--amber)] transition group-hover:scale-105"
              aria-hidden="true"
            />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SellActionPanel() {
  return (
    <div className="rounded-b-[1.5rem] bg-[radial-gradient(circle_at_top_right,rgba(255,199,44,0.16),transparent_36%),linear-gradient(145deg,#18233e_0%,#0a1e4d_100%)] p-5 text-white shadow-[0_30px_80px_-45px_rgba(10,30,77,0.9)] sm:p-7">
      <BodyTypeLinks />
      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-white/65">
          Choose a common body type or start without a selection. You can change
          every detail before saving your draft.
        </p>
        <Link
          href="/seller/listings/new"
          className={buttonVariants({
            variant: "amber",
            className: "h-12 shrink-0 px-6",
          })}
        >
          Start my listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SellHero() {
  return (
    <section className="bg-[linear-gradient(180deg,#f7f8fb_0%,#eef1f7_100%)] px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
              Sell my car
            </p>
            <h1 className="display mt-3 text-4xl leading-[1.05] text-[var(--ink-900)] sm:text-5xl lg:text-6xl">
              List your car with confidence.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--ink-500)]">
              Build a complete listing, disclose the facts clearly, and manage
              buyer interest from one protected seller workspace.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BadgeCheck
                className="h-5 w-5 text-[var(--verified)]"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-[var(--ink-700)]">
                Draft first. Review before publication.
              </span>
            </div>
            <Link
              href="/auth/signup?role=seller&next=%2Fseller%2Flistings%2Fnew"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-900)] underline decoration-[var(--amber)] decoration-2 underline-offset-4"
            >
              New to Auto IQ? Create a seller account{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <StageRail />
            <SellActionPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

function SellerGuide() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How it works"
          title="A clear path from draft to buyer interest"
          description="The seller workspace keeps the listing lifecycle visible, from the first detail through review and marketplace enquiries."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ProcessStep
            number="1"
            title="Create the draft"
            description="Add identity, specification, mileage, condition, accident history, and your asking price."
          />
          <ProcessStep
            number="2"
            title="Complete the evidence"
            description="Upload clear vehicle photos and required ownership documents in the seller workspace."
          />
          <ProcessStep
            number="3"
            title="Submit for review"
            description="Resolve the checklist, submit to Auto IQ, and manage buyer requests after publication."
          />
        </div>
      </div>
    </section>
  );
}

function SellerPreparation() {
  const items = [
    "Vehicle make, model, year, colour, and mileage",
    "Condition, accident history, and an honest asking price",
    "Clear exterior, interior, and detail photos",
    "Ownership and identity documents requested by the review checklist",
  ];
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className="rounded-[1.75rem] bg-[var(--ink-900)] p-6 text-white sm:p-8">
          <ShieldCheck
            className="h-7 w-7 text-[var(--amber)]"
            aria-hidden="true"
          />
          <h2 className="display mt-5 text-3xl text-white">
            Built for a more credible listing
          </h2>
          <ul className="mt-6 grid gap-4 text-sm leading-6 text-white/72">
            <li className="flex gap-3">
              <FileCheck2
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]"
                aria-hidden="true"
              />
              Structured condition and ownership disclosure
            </li>
            <li className="flex gap-3">
              <Upload
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]"
                aria-hidden="true"
              />
              Photos and documents kept with the listing
            </li>
            <li className="flex gap-3">
              <Tags
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]"
                aria-hidden="true"
              />
              Quotes and viewings tied to the right vehicle
            </li>
          </ul>
        </div>
        <div className="rounded-[1.75rem] border border-[var(--ink-100)] bg-[var(--ink-50)] p-6 sm:p-8">
          <ClipboardList
            className="h-7 w-7 text-[var(--amber-dark)]"
            aria-hidden="true"
          />
          <h2 className="display mt-5 text-3xl text-[var(--ink-900)]">
            Prepare these details
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
            Having these ready makes the listing wizard faster and reduces
            review delays.
          </p>
          <ul className="mt-6 grid gap-3">
            {items.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-6 text-[var(--ink-700)]"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--verified-soft)]">
                  <Check
                    className="h-3 w-3 text-[var(--verified)]"
                    aria-hidden="true"
                  />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SellerFaqs() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionIntro
          eyebrow="Questions"
          title="Know what to expect before you start"
          description="Straight answers about how an Auto IQ marketplace listing moves from draft to publication."
        />
        <div className="mt-8 divide-y divide-[var(--ink-100)] overflow-hidden rounded-[1.75rem] border border-[var(--ink-100)] bg-white">
          {FAQS.map(({ question, answer }) => (
            <details
              key={question}
              className="group p-5 open:bg-[var(--ink-50)]"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]">
                <span>{question}</span>
                <span
                  className="text-[var(--amber-dark)] transition group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-2 pt-3 text-sm leading-6 text-[var(--ink-500)]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SellCarFunnel() {
  return (
    <main>
      <SellHero />
      <SellerGuide />
      <SellerPreparation />
      <SellerFaqs />
    </main>
  );
}
