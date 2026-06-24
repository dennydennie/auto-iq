import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminReportsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={FileText}
        headline="No reports available"
        body="There are no downloadable reports for the current admin session."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
