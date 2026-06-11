import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminRequestsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Sparkles}
        headline="Buyer requests will land here."
        body="The admin request queue is part of the later marketplace and sourcing phases. This route now exists so the navigation model is stable before real data wiring."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
