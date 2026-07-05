import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/shared/auth-shell";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function ConsentsPage() {
  return (
    <AuthShell
      eyebrow="Consent capture"
      title="Record the permissions and product agreements that unlock the next workflow."
      description="The plan calls for dedicated consent capture before deeper seller flows. This screen makes those agreements understandable instead of hiding them in a generic checkbox wall."
      ctaLabel="Need to revisit registration?"
      ctaHref="/auth/signup"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Trust model
          </p>
          <p className="text-sm leading-7 text-white/72">
            Consent is part of the operational journey, not just legal decoration. The UI should show what each agreement actually unlocks.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <StepIndicator currentStep={3} totalSteps={3} label="Complete onboarding" />
        <div className="space-y-2">
          <Badge variant="outline">Consents</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">Confirm the operational agreements</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            Each consent maps to a real platform behaviour such as identity verification,
            inspection scheduling, or communication handling.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            {[
              "I consent to platform identity verification for secure account operations.",
              "I consent to inspection and listing workflow communications where applicable.",
              "I understand that admin review may request changes before publishing a listing.",
            ].map((item) => (
              <Checkbox key={item} defaultChecked label={item} />
            ))}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <BadgeCheck className="h-4 w-4 text-[var(--amber-dark)]" />
                <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
                  These consents let the product move you into protected listing and account workflows.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4">
                <ShieldCheck className="h-4 w-4 text-[var(--amber-dark)]" />
                <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
                  Clear consent messaging reduces surprise later when review, moderation, and communications begin.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/seller"
                className={buttonVariants({ variant: "amber", className: "flex-1 w-full" })}
              >
                Continue to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/onboarding"
                className={buttonVariants({ variant: "outline", className: "flex-1 w-full" })}
              >
                Back
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
