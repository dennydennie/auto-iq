import Link from "next/link";
import { ArrowRight, Check, ShoppingCart, Tag } from "lucide-react";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  {
    key: "buyer",
    title: "I’m buying",
    lead: "Find your next vehicle with full confidence.",
    bullets: [
      "Browse inspected vehicles with buyer-safe summaries",
      "Shortlist faster with trust scores and guided actions",
      "Request quotes and viewings without losing context",
    ],
    href: "/auth/signup?role=buyer",
    icon: ShoppingCart,
    theme: "bg-white",
  },
  {
    key: "seller",
    title: "I’m selling",
    lead: "List your vehicle and reach serious buyers.",
    bullets: [
      "Structured listing journey with clear progress",
      "Inspection and admin review steps made visible",
      "Dashboard feedback when changes are required",
    ],
    href: "/auth/signup?role=seller",
    icon: Tag,
    theme: "bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] text-white",
  },
];

export default function OnboardingPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title="How will you use BiSell AutoIQ?"
      description="Choose the path that fits your intent. You can always add more capabilities to your account later."
      ctaLabel="Already have an account?"
      ctaHref="/auth/login"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Tailored from the start
          </p>
          <p className="text-sm leading-7 text-white/72">
            Buyers and sellers have different needs. Picking your role now means you’ll
            see the right tools and steps from your first login.
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Badge variant="outline">Choose your role</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">
            How will you use AutoIQ?
          </h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            Start with the route that best matches your intent. You can still add more
            capabilities later.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <Link key={role.key} href={role.href} className="group block">
                <Card className={role.theme}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.1)] text-[#FFC72C]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#FFC72C] transition group-hover:translate-x-0.5" />
                    </div>
                    <CardTitle className={role.key === "seller" ? "text-white" : undefined}>
                      {role.title}
                    </CardTitle>
                    <CardDescription className={role.key === "seller" ? "text-white/70" : undefined}>
                      {role.lead}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {role.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FFC72C]" />
                        <p className={role.key === "seller" ? "text-sm leading-6 text-white/75" : "text-sm leading-6 text-[var(--ink-500)]"}>
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="rounded-[1.4rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
            Zimbabwe rollout
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
            The current product experience is tailored for the Zimbabwe market. Terms,
            inspection flows, and operating policies are written with that context in mind.
          </p>
        </div>

        <Link
          href="/auth/login"
          className={buttonVariants({ variant: "ghost", className: "w-full justify-center" })}
        >
          I already have an account
        </Link>
      </div>
    </AuthShell>
  );
}
