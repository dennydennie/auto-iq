import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateListingForm } from "@/components/seller/create-listing-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function SellerListingNewPage() {
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
          <Link href="/seller" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />
      <CreateListingForm />
    </main>
  );
}
