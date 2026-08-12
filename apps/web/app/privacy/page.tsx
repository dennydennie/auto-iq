import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/shared/page-container";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { absoluteSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITE_LINKS } from "@/lib/site-navigation";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How BiSell AutoIQ collects, uses, protects, and deletes user data.",
  alternates: { canonical: absoluteSiteUrl("/privacy") },
};

const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "Account information such as your name, email address, phone number, city, verification status, role, and buyer or seller preferences.",
      "Marketplace information such as saved vehicles, listings, photos, ownership documents, quote requests, vehicle requests, inspections, and viewing activity.",
      "Technical information needed to secure and operate the service, including session data, request identifiers, security events, and diagnostic or crash information when monitoring is enabled.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use information to provide account access, match buyers with vehicles, support seller and inspection workflows, arrange viewings, deliver service notifications, prevent abuse, and improve reliability.",
      "We do not use account data for unrelated purposes. Service providers may process limited data only where needed for hosting, storage, communications, diagnostics, or security.",
    ],
  },
  {
    title: "Storage, security, and retention",
    paragraphs: [
      "AutoIQ uses access controls, encrypted network connections, protected session cookies, tenant isolation, and audit records to reduce unauthorized access.",
      "We retain information while an account is active and as needed to operate marketplace workflows. Some records may be retained after deletion where required for fraud prevention, security, dispute handling, or legal obligations; retained data is limited to that purpose.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      "You can review and update supported profile information from the Account screen. You can request deletion from the app or from the public account-deletion page.",
      "We may need to verify that you control the account before completing a deletion request. Deletion removes or de-identifies associated personal data unless retention is required for a legitimate reason.",
    ],
  },
  {
    title: "How deletion requests are processed",
    paragraphs: [
      "Requests submitted in the app or through the public form enter a restricted operator queue. The acknowledgement does not reveal whether an email address is registered.",
      "Before completion, an authorised operator verifies account control, performs the required deletion or de-identification, reviews any records that must be retained, and records processing evidence.",
      "Retained records remain access-controlled and may be used only for the documented security, fraud-prevention, dispute, or legal purpose. A request is marked complete only after both identity verification and data handling are confirmed.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader
        links={PUBLIC_SITE_LINKS}
        homeHref="/"
        primaryCta={{ href: "/auth/login", messageKey: "auth.signIn" }}
      />
      <PageContainer as="main" size="content" className="py-10 sm:py-16">
        <article className="rounded-[2rem] bg-white p-6 shadow-[var(--shadow-card)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber-dark)]">
            Effective 12 August 2026
          </p>
          <h1 className="display mt-4 text-4xl sm:text-5xl">Privacy notice</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--ink-500)]">
            This notice explains how BiSell AutoIQ handles information across
            its website, mobile application, marketplace, and operational tools.
          </p>
          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="display text-2xl">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--ink-500)]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h2 className="display text-2xl">Privacy requests</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-500)]">
                To request account and associated-data deletion, use the{" "}
                <Link
                  className="font-semibold underline"
                  href="/account-deletion"
                >
                  account-deletion form
                </Link>
                . The form is available without signing in.
              </p>
            </section>
          </div>
        </article>
      </PageContainer>
      <SiteFooter />
    </>
  );
}
