import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password in one step."
      description="Enter your registered email address and we'll send a secure link to create a new password."
      ctaLabel="Remembered your password?"
      ctaHref="/auth/login"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            How it works
          </p>
          <p className="text-sm leading-7 text-white/72">
            We'll email you a secure reset link valid for 30 minutes. For security, the
            response is the same whether or not an account exists for that address.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Password recovery</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">Send reset instructions</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            Enter the email address tied to your account and we’ll send a secure reset link.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
