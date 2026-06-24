import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Set a new password"
      title="Choose a fresh password and return to your workflow."
      description="Use your password reset link to set a new password and return to sign in."
      ctaLabel="Need to request a new link?"
      ctaHref="/auth/forgot-password"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Secure reset
          </p>
          <p className="text-sm leading-7 text-white/72">
            Your link is used once. After the reset succeeds, sign in with your new
            password.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Reset password</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">Create a stronger password</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            Use a password that is unique to your AutoIQ account and easy for you to manage safely.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
