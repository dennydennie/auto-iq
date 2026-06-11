import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const roleCopy = {
  buyer: {
    title: "Create a buyer account",
    summary:
      "Set up your buyer profile so you can save vehicles, request quotes, and manage viewings from one place.",
  },
  seller: {
    title: "Create a seller account",
    summary:
      "Start your seller account so you can progress into consent capture and the structured listing workflow.",
  },
  default: {
    title: "Create your account",
    summary:
      "Set the basics up once, then we’ll route you into the right onboarding path for your role.",
  },
} as const;

type SearchParams = Promise<{ role?: string | string[] }>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveRole(role: string | undefined) {
  if (role === "buyer" || role === "seller") {
    return role;
  }

  return null;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const role = resolveRole(readParam(params.role));
  const active = role ? roleCopy[role] : roleCopy.default;

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start with the basics, then we'll route you in."
      description="Set up your account once. We'll guide you into the right journey for your role — buying, selling, or both."
      ctaLabel="Already have an account?"
      ctaHref="/auth/login"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Phone verification
          </p>
          <p className="text-sm leading-7 text-white/72">
            We verify your phone number after sign-up with a one-time code. This keeps
            your account secure and ensures sellers and buyers can reach each other.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <StepIndicator currentStep={1} totalSteps={3} label="Account creation" />

        <div className="space-y-2">
          <Badge variant="outline">Registration</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">{active.title}</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">{active.summary}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <RegisterForm role={role ?? "buyer"} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
