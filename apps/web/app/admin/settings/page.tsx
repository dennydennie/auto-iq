import { Settings } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Settings}
        headline="No configurable settings"
        body="Operational guardrails are managed through deployment configuration. Use the overview for current moderation controls."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
