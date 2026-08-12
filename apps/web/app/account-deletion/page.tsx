import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PublicAccountDeletionForm } from "@/components/account/public-account-deletion-form";
import { PageContainer } from "@/components/shared/page-container";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

export const metadata: Metadata = {
  title: "Request account deletion",
  description:
    "Request deletion of a BiSell AutoIQ account and associated data.",
  alternates: { canonical: absoluteSiteUrl("/account-deletion") },
};

export default async function AccountDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const requested = (await searchParams).requested === "1";
  return (
    <>
      <SiteHeader
        links={PUBLIC_SITE_LINKS}
        homeHref="/"
        primaryCta={{ href: "/auth/login", messageKey: "auth.signIn" }}
      />
      <PageContainer as="main" size="content" className="py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
              Privacy control
            </p>
            <h1 className="display mt-4 text-4xl sm:text-5xl">
              Request account deletion
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--ink-500)]">
              You can submit a request even if you no longer have the AutoIQ
              mobile app. Signed-in users can also request deletion from their
              Account screen.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--amber-soft)] p-4 text-sm leading-6 text-[var(--ink-700)]">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <p>
                A request does not immediately erase the account. We first
                verify ownership and review records that may need to be retained
                for fraud prevention, security, or legal obligations.
              </p>
            </div>
            <p className="mt-5 text-sm text-[var(--ink-500)]">
              See the{" "}
              <Link className="font-semibold underline" href="/privacy">
                privacy notice
              </Link>{" "}
              for more information.
            </p>
          </section>
          <Card>
            <CardHeader>
              <h2 className="display text-xl font-semibold tracking-tight">
                Deletion request
              </h2>
            </CardHeader>
            <CardContent>
              <PublicAccountDeletionForm requested={requested} />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
      <SiteFooter />
    </>
  );
}
