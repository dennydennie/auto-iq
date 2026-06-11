import { Heart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function SavedPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Heart}
        headline="Saved vehicles will appear here."
        body="Save vehicles you're interested in and come back to them any time."
        cta={{ label: "Browse vehicles", href: "/vehicles" }}
      />
    </main>
  );
}
