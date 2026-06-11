import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inspections = [
  {
    title: "Toyota Hilux pre-publish review",
    owner: "R. Moyo",
    state: "IN_PROGRESS",
  },
  {
    title: "Honda CR-V summary approval",
    owner: "T. Ncube",
    state: "REPORT_SUBMITTED",
  },
  {
    title: "Nissan X-Trail task creation",
    owner: "C. Dube",
    state: "SCHEDULED",
  },
];

export default function AdminInspectionsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <Badge variant="outline">Inspection operations</Badge>
      <h1 className="display mt-4 text-4xl text-[var(--ink-900)]">Inspection tasks</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-500)]">
        Assign and track vehicle inspections. Review submitted reports and move
        listings forward once inspections are complete.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {inspections.map((inspection, index) => {
          const Icon = index === 0 ? ClipboardCheck : index === 1 ? ShieldCheck : FileSearch;

          return (
            <Card key={inspection.title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ink-50)] text-[var(--amber-dark)]">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">{inspection.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--ink-500)]">
                <p>Owner: {inspection.owner}</p>
                <Badge variant="outline">{inspection.state}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
