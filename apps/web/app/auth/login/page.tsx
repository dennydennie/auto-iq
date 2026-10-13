import { AUTH_COPY as copy } from "@/lib/auth-copy";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Card, CardContent } from "@/components/ui/card";

type SearchParams = Promise<{
  identifier?: string | string[];
  next?: string | string[];
  verified?: string | string[];
  reset?: string | string[];
}>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readNextHref(value: string | undefined) {
  // Same-origin absolute path only — no open redirects.
  if (!value || !value.startsWith("/")) return undefined;
  if (value.startsWith("//") || value.includes("\\")) return undefined;
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const identifier = readParam(params.identifier) ?? "";
  const nextHref = readNextHref(readParam(params.next));
  const justVerified = readParam(params.verified) === "1";
  const justReset = readParam(params.reset) === "1";

  return (
    <AuthShell
      title={copy.loginTitle}
      description={copy.loginDescription}
      ctaLabel="Need a new account?"
      ctaHref="/auth/signup"
      highlight={
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup?role=seller"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#FFC72C]"
            >
              Create seller account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"
            >
              Use admin sign-in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="display text-3xl text-[var(--ink-900)] sm:text-[2.2rem]">
              Welcome back
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--ink-500)]">
              {copy.loginDescription}
            </p>
          </div>
        </div>

        {justVerified ? (
          <NoticeBanner message="Phone verified. Sign in with the password you set during registration." />
        ) : null}
        {justReset ? (
          <NoticeBanner message="Password updated. Sign in with your new password." />
        ) : null}

        <Card className="border-white/80 bg-white/96 shadow-[0_26px_80px_-58px_rgba(22,31,58,0.35)]">
          <CardContent className="p-6 sm:p-7">
            <LoginForm defaultIdentifier={identifier} nextHref={nextHref} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
