"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function defaultDuration(variant: ToastVariant) {
  if (variant === "error") return 5000;
  return 3000;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

const VARIANT_ICON = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const VARIANT_TONE = {
  success: "border-emerald-200 bg-white text-[var(--ink-900)]",
  error: "border-[rgba(220,38,38,0.25)] bg-white text-[var(--ink-900)]",
  info: "border-[var(--ink-200)] bg-white text-[var(--ink-900)]",
};

const VARIANT_ICON_TONE = {
  success: "text-emerald-600",
  error: "text-[var(--reject,#dc2626)]",
  info: "text-[var(--amber-dark)]",
};

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const variant = input.variant ?? "info";
      const id = randomId();
      const duration = input.duration ?? defaultDuration(variant);
      const newToast: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant,
        duration,
      };
      setToasts((current) => [...current, newToast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icon = VARIANT_ICON[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[0_24px_60px_-30px_rgba(22,31,58,0.35)]",
                VARIANT_TONE[item.variant],
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", VARIANT_ICON_TONE[item.variant])} aria-hidden="true" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold leading-5">{item.title}</p>
                {item.description ? (
                  <p className="text-xs leading-5 text-[var(--ink-500)]">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-400)] transition hover:bg-[var(--ink-50)] hover:text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Soft fallback so callers don't have to null-check.
    return {
      toast: () => undefined,
      dismiss: () => undefined,
    };
  }
  return context;
}
