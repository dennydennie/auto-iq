import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BiSellLogo } from "@/components/ui/bisell-logo";
import { Badge } from "@/components/ui/badge";

export function AuthShell({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  highlight,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  highlight: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(214,155,29,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(18,41,95,0.1),transparent_28%),linear-gradient(180deg,#f7f0e3_0%,#f3f4f8_52%,#edf2f8_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-2.5rem)] w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_36px_120px_-62px_rgba(22,31,58,0.42)] backdrop-blur lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,#17274c_0%,#111b35_100%)] px-6 py-7 text-white sm:px-9 sm:py-9 lg:border-b-0 lg:border-r lg:border-white/8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,205,83,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="rounded-[1.2rem] border border-white/20 bg-white/95 px-4 py-3 shadow-[0_20px_40px_-32px_rgba(255,255,255,0.6)]">
              <BiSellLogo size={34} />
            </div>
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                className:
                  "border-white/12 bg-white/8 text-white hover:bg-white/12 hover:text-white",
              })}
            >
              Browse vehicles
            </Link>
          </div>

          <div className="relative mt-10">
            <Badge variant="amber" className="bg-white/10 text-[#FFC72C]">
              {eyebrow}
            </Badge>
            <h1 className="display mt-5 max-w-xl text-4xl leading-[1.02] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              {description}
            </p>
          </div>

          <div className="relative mt-10 rounded-[1.6rem] border border-white/12 bg-white/7 p-5 backdrop-blur-sm">
            {highlight}
          </div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-xl">
            {children}
            <p className="mt-8 text-center text-sm text-[var(--ink-500)]">
              {ctaLabel}{" "}
              <Link
                href={ctaHref}
                className="font-semibold text-[var(--ink-900)] transition hover:text-[var(--amber-dark)]"
              >
                Continue here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
