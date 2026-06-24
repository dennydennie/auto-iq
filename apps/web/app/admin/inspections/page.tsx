import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminInspectionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={ShieldCheck}
        headline="No inspection tasks"
        body="Assigned inspection work that needs admin attention appears in this queue."
        cta={{ label: "Open moderation queue", href: "/admin/listings" }}
      />
    </main>
  );
}
