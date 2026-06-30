import type { MeResponse } from "@auto-iq/contracts/identity";
import type { SellerListingSummaryDto } from "@auto-iq/contracts/listings";
import type { OffsetPaginatedResponse } from "@auto-iq/contracts/pagination";
import { ROUTES } from "@auto-iq/contracts/routes";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, FileCheck2, Plus, UserPlus } from "lucide-react";
import { ActivateSellerButton } from "@/components/seller/activate-seller-button";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function SellerPage() {
  const profileResult = await getSessionJson<MeResponse>(ROUTES.me.profile);

  if (isServerApiFailure(profileResult)) {
    if (profileResult.error.statusCode === 401 || profileResult.error.statusCode === 403) {
      return <SellerLoginPrompt />;
    }
    return <SellerError message={profileResult.error.message} correlationId={profileResult.error.correlationId} />;
  }

  const profile = profileResult.data;
  if (!profile.roles.includes("SELLER") || !profile.sellerProfile) {
    return <SellerActivationPrompt profile={profile} />;
  }

  if (!profile.sellerProfile.consentsComplete) {
    return <SellerConsentPrompt profile={profile} />;
  }

  const listingsResult = await getSessionJson<OffsetPaginatedResponse<SellerListingSummaryDto>>(ROUTES.listings.list);
  if (isServerApiFailure(listingsResult)) {
    return <SellerError message={listingsResult.error.message} correlationId={listingsResult.error.correlationId} />;
  }

  return <SellerDashboard profile={profile} listings={listingsResult.data.data} />;
}

function SellerLoginPrompt() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <EmptyState
        icon={Plus}
        headline="Sign in to continue"
        body="Use your BiSell account to buy vehicles, start selling, and manage account workflows."
        cta={{ label: "Go to login", href: "/auth/login" }}
      />
    </main>
  );
}

function SellerError({ correlationId, message }: { correlationId?: string; message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <ErrorBanner message={message} correlationId={correlationId} />
    </main>
  );
}

function SellerActivationPrompt({ profile }: { profile: MeResponse }) {
  return (
    <SellerSetupCard
      icon={UserPlus}
      eyebrow="Seller access"
      title="Start selling with this account"
      body={`You are signed in as ${profile.fullName}. Enable seller tools on the same account so your buying and selling activity stays connected.`}
      action={<ActivateSellerButton />}
    />
  );
}

function SellerConsentPrompt({ profile }: { profile: MeResponse }) {
  return (
    <SellerSetupCard
      icon={FileCheck2}
      eyebrow="Seller agreements"
      title="Complete seller agreements"
      body={`${profile.fullName}, your seller workspace is ready. Accept the operating agreements to unlock drafts, listing review, and buyer activity.`}
      action={
        <Link href="/onboarding/consents?mode=seller" className={buttonVariants({ variant: "amber" })}>
          Complete agreements
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    />
  );
}

function SellerSetupCard({
  action,
  body,
  eyebrow,
  icon: Icon,
  title,
}: {
  action: ReactNode;
  body: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.85fr_1fr]">
          <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white">
            <Icon className="h-8 w-8 text-[#FFC72C]" />
            <h2 className="display mt-8 text-3xl text-white">One account can buy and sell.</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              BiSell keeps buyer and seller workflows attached to your verified identity, then gates listing tools behind explicit seller agreements.
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <Badge variant="outline" className="w-fit">{eyebrow}</Badge>
            <h1 className="display mt-4 text-4xl text-[var(--ink-900)]">{title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--ink-500)]">{body}</p>
            <div className="mt-8">{action}</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
