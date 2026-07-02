import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const audienceCards = [
  {
    title: "Buyer experience",
    body: "Browse inspected vehicles, compare trust signals quickly, and move from shortlist to viewing with less guesswork.",
  },
  {
    title: "Seller workflow",
    body: "List with structure, understand where your vehicle is in review, and see exactly what needs attention before publish.",
  },
  {
    title: "Admin operations",
    body: "Run queues, schedule inspections and viewings, and keep moderation decisions legible across the whole platform.",
  },
];

const pillars = [
  "Inspection reports and trust scores on every listing",
  "Structured seller workflow from draft through to publish",
  "Buyer-safe summaries so you know what you're viewing before you show up",
  "Admin review layer that keeps the marketplace reliable",
];

export default function AboutPage() {
  return (
    <main className="pb-24">
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 px-5 py-6 shadow-[0_30px_120px_-50px_rgba(22,31,58,0.45)] backdrop-blur sm:px-8 sm:py-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <BiSellLogo size={38} />
              <h1 className="display mt-8 max-w-3xl text-5xl leading-[0.92] text-[var(--ink-900)] sm:text-6xl lg:text-7xl">
                Buy and sell vehicles with full confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-500)] sm:text-lg">
                BiSell AutoIQ brings inspection reports, trust scoring, and structured
                workflows to the Zimbabwean car market — so every transaction is clear,
                documented, and fair.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className={buttonVariants({ variant: "amber", size: "lg" })}
                >
                  Browse vehicles
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Sign in
                </Link>
              </div>
            </div>

            <Card className="max-w-lg overflow-hidden bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] text-white">
              <CardHeader>
                <Badge variant="amber" className="w-fit bg-white/10 text-[#FFC72C]">
                  Built for Zimbabwe
                </Badge>
                <CardTitle className="mt-3 text-3xl text-white">
                  A marketplace you can trust
                </CardTitle>
                <CardDescription className="text-white/65">
                  Every listing on AutoIQ passes through a verified review process before
                  reaching buyers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pillars.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC72C]" />
                    <p className="text-sm leading-6 text-white/78">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8 sm:my-10" />

          <div className="grid gap-4 lg:grid-cols-3">
            {audienceCards.map((card, index) => (
              <Card
                key={card.title}
                className={cn(index === 1 && "bg-[var(--ink-900)] text-white")}
              >
                <CardHeader>
                  <CardTitle className={cn("text-2xl", index === 1 && "text-white")}>
                    {card.title}
                  </CardTitle>
                  <CardDescription className={cn(index === 1 && "text-white/70")}>
                    {card.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">How it works</CardTitle>
            <CardDescription>
              AutoIQ adds a structured layer to private car sales in Zimbabwe — from
              the first listing through to ownership handover.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.35rem] bg-[var(--ink-50)]/80 p-5">
              <ShieldCheck className="h-6 w-6 text-[var(--ink-900)]" />
              <h3 className="display mt-4 text-xl">Verified listings</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
                Every vehicle goes through admin review and inspection before it reaches
                buyers, so you know what you&apos;re looking at.
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-[var(--ink-50)]/80 p-5">
              <Sparkles className="h-6 w-6 text-[var(--ink-900)]" />
              <h3 className="display mt-4 text-xl">Clear next steps</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
                Whether you&apos;re a buyer shortlisting, a seller waiting on review, or an
                admin running the queue - the platform always shows you what&apos;s next.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--ink-900)] text-white">
          <CardHeader>
            <Badge variant="amber" className="w-fit bg-white/10 text-[#FFC72C]">
              Get started
            </Badge>
            <CardTitle className="text-3xl text-white">Ready to begin?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/72">
            <p>Browse inspected vehicles in the marketplace</p>
            <p>List your vehicle and track it through review</p>
            <p>Request quotes and book viewings</p>
            <p>Manage everything from one verified account</p>
            <div className="pt-4">
              <Link href="/onboarding" className={buttonVariants({ variant: "amber" })}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[var(--ink-100)] bg-[var(--ink-50)]/80 p-8 lg:border-b-0 lg:border-r">
              <h2 className="display mt-4 text-4xl text-[var(--ink-900)]">
                The car market you deserve.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-500)]">
                Private car sales in Zimbabwe shouldn&apos;t depend on guesswork and word of
                mouth. AutoIQ puts inspection data, verified identities, and clear process
                steps in the hands of buyers and sellers alike.
              </p>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {[
                {
                  icon: BadgeCheck,
                  title: "Verified identities",
                  body: "Every buyer and seller goes through phone verification. You know who you're dealing with.",
                },
                {
                  icon: Sparkles,
                  title: "Inspection-backed listings",
                  body: "Vehicles are inspected before going live. Buyers get a plain-English summary of condition.",
                },
                {
                  icon: ShieldCheck,
                  title: "Structured process",
                  body: "From listing to handover, every step is tracked. Nothing falls through the cracks.",
                },
                {
                  icon: ArrowRight,
                  title: "Book viewings in-app",
                  body: "Request, confirm, and manage viewings without leaving the platform.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="border-t border-[var(--ink-100)] p-6 sm:border-l">
                  <Icon className="h-5 w-5 text-[var(--amber-dark)]" />
                  <h3 className="display mt-4 text-xl text-[var(--ink-900)]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
