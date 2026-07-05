import { OtpForm } from "@/components/auth/otp-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type SearchParams = Promise<{
  identifier?: string | string[];
  phone?: string | string[];
  registered?: string | string[];
}>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OtpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const identifier = readParam(params.identifier) ?? readParam(params.phone) ?? null;
  const phone = readParam(params.phone) ?? null;
  const autoSend = readParam(params.registered) === "1";

  return (
    <AuthShell
      eyebrow="Account verification"
      title="Confirm your identity with a one-time code."
      description="We send a 6-digit code to the contact channels on file. Enter it below to complete verification."
      ctaLabel="Wrong contact details?"
      ctaHref="/auth/signup"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Didn&apos;t receive a code?
          </p>
          <p className="text-sm leading-7 text-white/72">
            Check your SMS inbox and account email, or tap &ldquo;Resend code&rdquo; below.
            Codes expire after 5 minutes. Make sure the number you registered is correct.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <StepIndicator currentStep={2} totalSteps={3} label="Verify identity" />
        <div className="space-y-2">
          <Badge variant="outline">Verification</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">Enter the 6-digit code</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            {identifier ? (
              <>
                We&apos;ve sent a one-time code to the SMS and email channels tied to{" "}
                <span className="font-semibold text-[var(--ink-700)]">{identifier}</span>.
              </>
            ) : (
              "Open this page from login or registration so we know which account to verify."
            )}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <OtpForm identifier={identifier} phone={phone} autoSend={autoSend} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
