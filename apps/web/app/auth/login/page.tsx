import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  LayoutDashboard,
} from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ACCESS_LANES = [
  {
    title: "Buyer",
    body: "Saved vehicles, quotes, and viewings stay in one place.",
    icon: CarFront,
  },
  {
    title: "Seller",
    body: "Listings, inspections, and pricing continue from your last step.",
    icon: BadgeCheck,
  },
  {
    title: "Admin",
    body: "Operations access remains behind the dedicated console route.",
    icon: LayoutDashboard,
  },
] as const;

type LoginSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readNext(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const nextHref = readNext(params.next);

  return (
    <AuthShell
      eyebrow="Account access"
      title="Sign in once and get back to work."
      description="Buyer, seller, and operator accounts all use the same trusted session model. Once the account is validated, we route the next step for you."
      ctaLabel="Need a new account?"
      ctaHref="/auth/signup"
      highlight={
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC72C]">
              One verified identity
            </p>
            <p className="text-sm leading-7 text-white/72">
              Use the same account for marketplace activity, seller workflows, and
              platform operations. Only the admin console stays on its own route.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {ACCESS_LANES.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[1.35rem] border border-white/10 bg-white/7 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-4 w-4 text-[#FFC72C]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/65">{body}</p>
              </div>
            ))}
          </div>

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
          <Badge variant="outline">Sign in</Badge>
          <div className="space-y-2">
            <h2 className="display text-3xl text-[var(--ink-900)] sm:text-[2.2rem]">
              Welcome back
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--ink-500)]">
              Enter your details to continue. Seller and buyer accounts route
              automatically after login, while platform operators can also use the
              dedicated admin path.
            </p>
          </div>
        </div>

        <Card className="border-white/80 bg-white/96 shadow-[0_26px_80px_-58px_rgba(22,31,58,0.35)]">
          <CardContent className="p-6 sm:p-7">
            <LoginForm nextHref={nextHref} />
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
