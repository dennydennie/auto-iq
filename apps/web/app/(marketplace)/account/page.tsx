import { UserRound } from "lucide-react";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ROUTES } from "@auto-iq/contracts/routes";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { AccountForm } from "@/components/account/account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function AccountPage() {
  const [result, referenceResult] = await Promise.all([
    getSessionJson<MeResponse>(ROUTES.me.profile),
    getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all),
  ]);

  if (isServerApiFailure(result)) {
    if (result.error.statusCode === 401 || result.error.statusCode === 403) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            icon={UserRound}
            headline="Sign in to manage your account"
            body="Your profile, preferences, and seller details are available after you sign in."
            cta={{ label: "Sign in", href: "/auth/login?next=/account" }}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorBanner message={result.error.message} correlationId={result.error.correlationId} />
      </main>
    );
  }

  if (isServerApiFailure(referenceResult)) {
    return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><ErrorBanner message={referenceResult.error.message} correlationId={referenceResult.error.correlationId} /></main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account settings"
        title="Manage your account"
        description="Keep your profile and vehicle preferences up to date. Email, phone, and password changes are managed separately."
      />
      <AccountForm profile={result.data} referenceData={referenceResult.data} />
    </main>
  );
}
