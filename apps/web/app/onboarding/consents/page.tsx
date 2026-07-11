import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import { RecordConsentsForm } from "@/components/auth/record-consents-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { ErrorBanner } from "@/components/shared/error-banner";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function ConsentsPage() {
  const result = await getSessionJson<MeResponse>(ROUTES.me.profile);
  return (
    <AuthShell
      eyebrow="Account agreements"
      title="Review the rules that keep marketplace activity secure."
      description="Accept the agreements required for your buyer or seller account before continuing."
      ctaLabel="Need to sign in again?"
      ctaHref="/auth/login"
      highlight={
        <p className="text-sm leading-7 text-white/72">
          Your choices are versioned and recorded so you can see exactly which
          marketplace rules apply to your account.
        </p>
      }
    >
      <div className="space-y-6">
        <StepIndicator
          currentStep={3}
          totalSteps={3}
          label="Complete onboarding"
        />
        <div className="space-y-2">
          <Badge variant="outline">Agreements</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">
            Confirm and continue
          </h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            These choices are recorded against your account with the current
            agreement version.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            {isServerApiFailure(result) ? (
              <ErrorBanner
                message={result.error.message}
                correlationId={result.error.correlationId}
              />
            ) : (
              <RecordConsentsForm roles={result.data.roles} />
            )}
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
