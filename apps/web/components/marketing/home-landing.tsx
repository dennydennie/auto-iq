import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  ClipboardCheck,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: "Verified signals", body: "See the trust context before you make contact." },
  { icon: ClipboardCheck, title: "Inspection context", body: "Make decisions with structured vehicle information." },
  { icon: ShieldCheck, title: "Protected requests", body: "Keep quotes and viewings organised in one place." },
] as const;

const MOVE_OPTIONS = [
  { icon: CarFront, title: "I want to buy", body: "Browse vehicles, compare the facts, and request a viewing.", href: "/buy-a-car", label: "Browse cars" },
  { icon: WalletCards, title: "I want to sell", body: "Create a structured listing and move through review with confidence.", href: "/sell-my-car", label: "Sell my car" },
] as const;

function HeroCarIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]" aria-hidden="true">
      <svg viewBox="0 0 640 390" className="relative z-10 w-full drop-shadow-[0_30px_25px_rgba(0,0,0,0.28)]">
        <defs>
          <linearGradient id="auto-iq-car" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFD95A" />
            <stop offset="0.5" stopColor="#FFC72C" />
            <stop offset="1" stopColor="#E49A00" />
          </linearGradient>
          <linearGradient id="auto-iq-glass" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#D8EEFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#8EA6C8" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M34 332C125 302 165 248 259 245c111-3 156 38 347 31" fill="none" stroke="#F47B20" strokeLinecap="round" strokeWidth="28" />
        <path d="M175 238c17-37 36-67 70-90l58-39c15-10 34-15 52-15h78c22 0 40 8 57 23l70 62c11 10 24 16 39 19l37 8c12 3 21 14 21 26v20H188c-11 0-18-10-13-14Z" fill="url(#auto-iq-car)" stroke="#0A1E4D" strokeWidth="7" />
        <path d="M292 108l-40 32h75l25-48h73c18 0 31 4 42 14l39 34H320Z" fill="url(#auto-iq-glass)" stroke="#0A1E4D" strokeWidth="6" />
        <path d="M394 95v45h74" fill="none" stroke="#0A1E4D" strokeWidth="5" />
        <path d="M175 238h352" fill="none" stroke="#FFF1B8" strokeWidth="8" />
        <path d="M515 198h54" fill="none" stroke="#FFF" strokeLinecap="round" strokeWidth="7" />
        <path d="M182 204h31" fill="none" stroke="#0A1E4D" strokeLinecap="round" strokeWidth="8" />
        <circle cx="255" cy="250" r="43" fill="#0A1E4D" stroke="#D6DAE5" strokeWidth="8" />
        <circle cx="255" cy="250" r="17" fill="#FFC72C" />
        <circle cx="525" cy="250" r="43" fill="#0A1E4D" stroke="#D6DAE5" strokeWidth="8" />
        <circle cx="525" cy="250" r="17" fill="#FFC72C" />
        <path d="M585 184l23 8v22l-25-1Z" fill="#F47B20" />
        <path d="M169 189l-25 8v22l29-1Z" fill="#FFF1B8" />
      </svg>
      <div className="absolute bottom-5 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-full bg-black/25 blur-2xl" />
    </div>
  );
}

function SearchCard() {
  return (
    <form action="/vehicles" className="grid gap-3 rounded-[1.5rem] border border-white/70 bg-white p-3 shadow-[0_30px_70px_-35px_rgba(5,20,56,0.7)] md:grid-cols-[1fr_1fr_auto]">
      <label className="relative block">
        <span className="sr-only">Vehicle make</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" aria-hidden="true" />
        <input name="make" placeholder="Search by make, e.g. Toyota" className="h-12 w-full rounded-xl border border-[var(--ink-200)] bg-white pl-11 pr-4 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--amber-dark)] focus:ring-2 focus:ring-[var(--amber)]/25" />
      </label>
      <label className="relative block">
        <span className="sr-only">Location</span>
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" aria-hidden="true" />
        <input name="city" placeholder="Location, e.g. Harare" className="h-12 w-full rounded-xl border border-[var(--ink-200)] bg-white pl-11 pr-4 text-sm text-[var(--ink-900)] outline-none transition placeholder:text-[var(--ink-400)] focus:border-[var(--amber-dark)] focus:ring-2 focus:ring-[var(--amber)]/25" />
      </label>
      <button className={buttonVariants({ variant: "amber", className: "h-12 px-7" })}>
        Search cars <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function TrustStrip() {
  return (
    <section className="bg-[var(--ink-900)] px-4 py-5 sm:px-6 lg:px-8">
      <ul className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
        {TRUST_ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]" aria-hidden="true" />
            <div><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-5 text-white/65">{body}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MoveOptions() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">Start here</p>
        <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">What are you looking to do?</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-500)] sm:text-base">Choose the journey that fits your next move. Auto IQ keeps the important details clear from first search to final handover.</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {MOVE_OPTIONS.map(({ icon: Icon, title, body, href, label }) => (
          <article key={title} className="group rounded-[1.75rem] border border-[var(--ink-100)] bg-white p-6 shadow-[0_20px_55px_-42px_rgba(10,30,77,0.6)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-42px_rgba(10,30,77,0.7)] sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--amber-soft)] text-[var(--ink-900)]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
            <h3 className="display mt-6 text-2xl text-[var(--ink-900)]">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-500)]">{body}</p>
            <Link href={href} className={buttonVariants({ variant: "outline", className: "mt-6" })}>{label}<ArrowRight className="h-4 w-4" /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Browse the marketplace", "Use make, location, body type, year, price, and verified filters to narrow the field."],
    ["02", "Understand the vehicle", "Review photos, pricing, seller information, and inspection context before you engage."],
    ["03", "Take the next step", "Request a quote or viewing and keep the conversation tied to the vehicle you care about."],
  ];
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">Simple by design</p><h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">From first search to a confident decision.</h2></div>
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-500)] sm:text-base">A clear marketplace experience for Zimbabwean buyers and sellers, with structured workflows behind every important step.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, body]) => <article key={number} className="rounded-2xl border border-[var(--ink-100)] bg-[var(--paper)] p-5"><span className="mono text-sm font-semibold text-[var(--amber-dark)]">{number}</span><h3 className="mt-6 text-lg font-semibold text-[var(--ink-900)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">{body}</p></article>)}
        </div>
      </div>
    </section>
  );
}

export function HomeLanding() {
  return (
    <main>
      <section className="relative overflow-x-hidden bg-[linear-gradient(135deg,#051438_0%,#0A1E4D_56%,#18233E_100%)] px-4 pb-28 pt-12 text-white sm:px-6 sm:pt-16 lg:px-8 lg:pb-36">
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-[var(--amber)]/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative z-20">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber)]">Zimbabwe&apos;s trust-first vehicle marketplace</p>
            <h1 className="display mt-6 max-w-3xl text-5xl leading-[0.94] sm:text-7xl">Your next car. Your next move.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Buy and sell vehicles with the facts up front, structured requests, and a clear path from search to handover.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sell-my-car" className={buttonVariants({ variant: "amber", className: "px-6" })}>Sell my car <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/buy-a-car" className={buttonVariants({ variant: "default", className: "border border-white/20 bg-white/10 px-6 text-white hover:bg-white/15" })}>Buy a car <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <HeroCarIllustration />
        </div>
        <div className="relative z-20 mx-auto -mb-44 mt-6 max-w-5xl"><SearchCard /></div>
      </section>
      <TrustStrip />
      <MoveOptions />
      <HowItWorks />
      <section className="px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] bg-[var(--amber)] p-7 text-[var(--ink-900)] sm:flex-row sm:items-center sm:justify-between sm:p-10"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-900)]/65">Ready when you are</p><h2 className="display mt-3 text-3xl sm:text-4xl">Make your next move with Auto IQ.</h2></div><Link href="/vehicles" className={buttonVariants({ variant: "default", className: "shrink-0" })}>Explore vehicles <Sparkles className="h-4 w-4" /></Link></div></section>
    </main>
  );
}
