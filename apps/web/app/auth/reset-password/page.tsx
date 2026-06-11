import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type SearchParams = Promise<{ token?: string | string[] }>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = readParam(params.token) ?? null;

  return (
    <AuthShell
      eyebrow="Set a new password"
      title="Choose a fresh password and return to your workflow."
      description="Reset needs to be direct and trustworthy. This screen surfaces token state and makes the completion step the clearest action on the page."
      ctaLabel="Need to request a new link?"
      ctaHref="/auth/forgot-password"
      highlight={
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
            Token state
          </p>
          <p className="text-sm leading-7 text-white/72">
            {token
              ? "A reset token is present, so the user can complete the change here."
              : "No token is present yet. The UI still explains the expected flow and blocks unsafe submission."}
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
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
