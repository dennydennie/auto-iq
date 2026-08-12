"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useOverlayDialog } from "@/components/shared/use-overlay-dialog";
import { Button } from "@/components/ui/button";

export function MobileFilterDrawer({
  filterCount,
  children,
}: {
  filterCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  useOverlayDialog(open, panelRef, close);

  return (
    <>
      <Button ref={triggerRef} variant="outline" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters{filterCount > 0 ? ` (${filterCount})` : ""}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-[rgba(5,20,56,0.48)] lg:hidden"
          onMouseDown={close}
        >
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
            className="ms-auto h-full w-full max-w-sm overflow-y-auto bg-[var(--paper)] p-4 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="mobile-filter-title"
                className="display text-xl text-[var(--ink-900)]"
              >
                Filter vehicles
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                aria-label="Close filters"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            {children}
          </aside>
        </div>
      ) : null}
    </>
  );
}
