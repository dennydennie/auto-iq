import { CreateListingForm } from "@/components/seller/create-listing-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Badge } from "@/components/ui/badge";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

export default async function SellerListingNewPage() {
  const referenceDataResult = await getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all);

  if (isServerApiFailure(referenceDataResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner
          message={referenceDataResult.error.message}
          correlationId={referenceDataResult.error.correlationId}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <div className="space-y-3">
          <Badge variant="outline">New listing</Badge>
          <h1 className="display text-4xl text-[var(--ink-900)]">
            List your vehicle
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
            Work through one short section at a time, then review the draft before saving it
            to your seller workspace.
          </p>
        </div>
        <CreateListingForm referenceData={referenceDataResult.data} />
      </div>
    </main>
  );
}
