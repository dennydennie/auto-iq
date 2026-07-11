import Link from "next/link";
import { BODY_TYPES, type BodyType } from "@auto-iq/contracts/enums";
import { ArrowLeft } from "lucide-react";
import { CreateListingForm } from "@/components/seller/create-listing-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readBodyType(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && BODY_TYPES.includes(candidate as BodyType)
    ? (candidate as BodyType)
    : undefined;
}

export default async function SellerListingNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialBodyType = readBodyType(params.bodyType);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="New listing"
        title="List your vehicle"
        description="Work through one short section at a time, then review the draft before saving."
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
      <CreateListingForm initialBodyType={initialBodyType} />
    </main>
  );
}
