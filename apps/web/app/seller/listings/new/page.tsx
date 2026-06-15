import { CreateListingForm } from "@/components/seller/create-listing-form";
import { StepIndicator } from "@/components/shared/step-indicator";
import { Badge } from "@/components/ui/badge";

export default function SellerListingNewPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:p-8">
        <StepIndicator currentStep={1} totalSteps={5} label="Seller listing wizard" />
        <div className="space-y-3">
          <Badge variant="outline">New listing</Badge>
          <h1 className="display text-4xl text-[var(--ink-900)]">
            List your vehicle
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
            Complete the steps below to create your listing. Save the draft at the end of this
            step to persist your progress before you leave the page.
          </p>
        </div>
        <CreateListingForm />
      </div>
    </main>
  );
}
