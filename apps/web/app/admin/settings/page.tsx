import { Settings } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Settings}
        headline="Settings and guardrails belong here."
        body="This placeholder reserves the administrative settings space while the product plan is still focused on auth, marketplace, seller, and moderation flows."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
