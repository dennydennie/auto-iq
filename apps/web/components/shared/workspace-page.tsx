import type { ReactNode } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { cn } from "@/lib/utils";

export function WorkspacePage({
  size = "wide",
  className,
  children,
}: {
  size?: "wide" | "content";
  className?: string;
  children: ReactNode;
}) {
  return (
    <PageContainer
      as="main"
      size={size}
      className={cn("pb-20 pt-6", className)}
    >
      {children}
    </PageContainer>
  );
}
