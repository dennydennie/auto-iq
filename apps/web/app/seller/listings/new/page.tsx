import Link from "next/link";
import type { BodyType } from "@auto-iq/contracts/enums";
import type { ReferenceDataResponse } from "@auto-iq/contracts/reference-data";
import { ROUTES } from "@auto-iq/contracts/routes";
import { ArrowLeft } from "lucide-react";
import { CreateListingForm } from "@/components/seller/create-listing-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getSessionJson, isServerApiFailure } from "@/lib/server-api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readBodyType(
  value: string | string[] | undefined,
  referenceData: ReferenceDataResponse,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && referenceData.bodyTypes.some((option) => option.value === candidate)
    ? (candidate as BodyType)
    : undefined;
}

export default async function SellerListingNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const referenceResult = await getSessionJson<ReferenceDataResponse>(ROUTES.referenceData.all);
  if (isServerApiFailure(referenceResult)) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <ErrorBanner message={referenceResult.error.message} correlationId={referenceResult.error.correlationId} />
      </main>
    );
  }
  const referenceData = referenceResult.data;
  const initialBodyType = readBodyType(params.bodyType, referenceData);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="New listing"
        title="List your vehicle"
        description="Complete specs, pricing, photos, and ownership documents, then submit one verified draft for review."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Seller dashboard", href: "/seller" },
              { label: "All listings", href: "/seller/listings" },
              { label: "New listing" },
            ]}
          />
        }
        actions={
          <Link
            href="/seller"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />
      <CreateListingForm initialBodyType={initialBodyType} referenceData={referenceData} />
    </main>
  );
}
