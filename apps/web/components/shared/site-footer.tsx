import Link from "next/link";
import { PageContainer } from "@/components/shared/page-container";

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      ["Buy a car", "/buy-a-car"],
      ["Browse vehicles", "/vehicles"],
      ["Sell my car", "/sell-my-car"],
    ],
  },
  {
    title: "Your account",
    links: [
      ["Saved vehicles", "/saved"],
      ["Requests", "/requests"],
      ["Sign in", "/auth/login"],
    ],
  },
  {
    title: "Auto IQ",
    links: [
      ["About us", "/about"],
      ["How it works", "/about#verification"],
      ["Create an account", "/auth/signup"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[var(--ink-900)] pb-8 pt-14 text-white">
      <PageContainer>
        <div className="border-b border-white/10 pb-8">
          <p className="display text-2xl">BiSell AutoIQ</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/60">
            A clearer way to buy and sell vehicles in Zimbabwe.
          </p>
        </div>
        <div className="grid gap-8 py-10 sm:grid-cols-3">
          {FOOTER_GROUPS.map((group) => (
            <FooterGroup key={group.title} {...group} />
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BiSell AutoIQ. All rights reserved.
          </p>
          <p>Inspection and verification context where available.</p>
        </div>
      </PageContainer>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-white/60 transition hover:text-[var(--amber)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
