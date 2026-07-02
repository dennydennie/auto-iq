"use client";

import { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "destructive",
  busy = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Sync open prop with the native dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      if (!busy) {
        onClose();
      }
    },
    [busy, onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className={cn(
        "max-w-md rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-0 shadow-[0_40px_120px_-30px_rgba(22,31,58,0.45)] backdrop:bg-[rgba(10,30,77,0.45)] backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in",
      )}
    >
      {open ? (
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                variant === "destructive"
                  ? "bg-[rgba(220,38,38,0.1)] text-[var(--reject,#dc2626)]"
                  : "bg-[var(--ink-50)] text-[var(--ink-900)]",
              )}
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <h2
                id="confirm-dialog-title"
                className="display text-2xl text-[var(--ink-900)]"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="text-sm leading-6 text-[var(--ink-500)]"
              >
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close dialog"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--ink-100)] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "amber"}
              onClick={onConfirm}
              disabled={busy}
              autoFocus
            >
              {busy ? "Working..." : confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
