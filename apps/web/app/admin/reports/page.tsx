import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminReportsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={FileText}
        headline="Reporting surfaces will be added here."
        body="The route exists now so the console structure can grow without being reshuffled later when reporting and observability workflows are implemented."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
