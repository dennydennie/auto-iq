import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shared/site-header";

const LINKS = [
  { href: "/inspector/tasks", messageKey: "nav.inspectionTasks" as const },
  { href: "/vehicles", messageKey: "nav.marketplace" as const },
];

export default function InspectorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader links={LINKS} homeHref="/inspector/tasks" signedIn />
      {children}
    </>
  );
}
