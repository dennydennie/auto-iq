import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={Users}
        headline="No user actions available"
        body="User access is controlled by account roles. Return to the overview when there are moderation tasks to review."
        cta={{ label: "Return to admin home", href: "/admin" }}
      />
    </main>
  );
}
