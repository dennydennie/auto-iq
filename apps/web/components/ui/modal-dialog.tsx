"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalDialogProps = {
  children: React.ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function ModalDialog({
  children,
  description,
  onClose,
  open,
  title,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="modal-dialog-title"
      aria-describedby={description ? "modal-dialog-description" : undefined}
      className={cn(
        "fixed left-1/2 top-1/2 m-0 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-[var(--ink-100)] bg-white p-0 shadow-[0_40px_120px_-30px_rgba(22,31,58,0.45)] backdrop:bg-[rgba(10,30,77,0.45)] backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in",
      )}
    >
      {open ? (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-dialog-title" className="display text-2xl text-[var(--ink-900)]">
                {title}
              </h2>
              {description ? (
                <p id="modal-dialog-description" className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
