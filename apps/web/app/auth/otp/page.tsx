import { OtpForm } from "@/components/auth/otp-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type SearchParams = Promise<{
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
  const phone = readParam(params.phone) ?? null;
  const autoSend = readParam(params.registered) === "1";

  return (
    <AuthShell
      eyebrow="Phone verification"
      title="Confirm your identity with a one-time code."
      description="We sent a 6-digit code to your registered phone number. Enter it below to complete verification."
      ctaLabel="Wrong phone number?"
      ctaHref="/auth/signup"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Didn&apos;t receive a code?
          </p>
          <p className="text-sm leading-7 text-white/72">
            Check your SMS inbox or tap &ldquo;Resend code&rdquo; below. Codes expire after
            10 minutes. Make sure the number you registered is correct.
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
            {phone ? (
              <>
                We&apos;ve sent a one-time code to{" "}
                <span className="font-semibold text-[var(--ink-700)]">{phone}</span>.
              </>
            ) : (
              "Open this page from the registration flow so we know which phone number to verify."
            )}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <OtpForm phone={phone} autoSend={autoSend} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
