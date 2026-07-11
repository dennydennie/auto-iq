import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shared/site-header";

const LINKS = [
  { href: "/inspector/tasks", label: "Inspection tasks" },
  { href: "/vehicles", label: "Marketplace" },
];

export default function InspectorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader links={LINKS} homeHref="/inspector/tasks" signedIn />
      {children}
    </>
  );
}
