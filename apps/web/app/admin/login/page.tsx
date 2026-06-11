import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <AuthShell
      eyebrow="Admin access"
      title="Operations console sign-in."
      description="Log in to manage the moderation queue, schedule inspections, and review platform activity."
      ctaLabel="Need the standard user login?"
      ctaHref="/auth/login"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Platform operators only
          </p>
          <p className="text-sm leading-7 text-white/72">
            This console is for BiSell platform operators. Buyers and sellers sign in
            from the standard login page.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">Admin access</Badge>
          <h2 className="display text-3xl text-[var(--ink-900)]">Log in to the console</h2>
          <p className="text-sm leading-7 text-[var(--ink-500)]">
            This route is designed for queue management, moderation, and operational review
            rather than general marketplace activity.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <LoginForm mode="admin" />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
