import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminRequestsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Sparkles}
        headline="No buyer requests"
        body="Buyer sourcing requests that need admin follow-up appear in this queue."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
