"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Paginator({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange?: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--ink-200)] bg-white px-4 py-3">
      <p className="text-sm text-[var(--ink-500)]">
        Page <span className="font-semibold text-[var(--ink-900)]">{page}</span> of{" "}
        <span className="font-semibold text-[var(--ink-900)]">{Math.max(totalPages, 1)}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange?.(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
