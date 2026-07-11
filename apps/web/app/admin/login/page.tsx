import type { Metadata } from "next";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin sign in | BiSell AutoIQ",
  description: "Secure operator access for the BiSell AutoIQ admin console.",
};

type SearchParams = Promise<{
  identifier?: string | string[];
  next?: string | string[];
}>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readNextHref(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value.startsWith("/admin") ? value : undefined;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Operator access"
      title="Enter the admin console with verified credentials."
      description="Admin access is separated from buyer and seller workflows so operational actions stay auditable and role-gated."
      ctaLabel="Need marketplace access instead?"
      ctaHref="/auth/login"
      highlight={
        <div className="space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <LayoutDashboard className="h-5 w-5 text-[#FFC72C]" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
              Console route
            </p>
            <p className="text-sm leading-7 text-white/72">
              Only authorised admin accounts can continue past this screen.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/7 p-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-[#FFC72C]" />
              Role checked after authentication
            </div>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Buyer and seller accounts are redirected away from the console.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Badge variant="outline">Admin sign in</Badge>
          <div className="space-y-2">
            <h2 className="display text-3xl text-[var(--ink-900)] sm:text-[2.2rem]">
              Platform operators
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--ink-500)]">
              Use the same identity service, with an admin role check before the
              console opens.
            </p>
          </div>
        </div>

        <Card className="border-white/80 bg-white/96 shadow-[0_26px_80px_-58px_rgba(22,31,58,0.35)]">
          <CardContent className="p-6 sm:p-7">
            <LoginForm
              mode="admin"
              defaultIdentifier={readParam(params.identifier) ?? ""}
              nextHref={readNextHref(readParam(params.next))}
            />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
