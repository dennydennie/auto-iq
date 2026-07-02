"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toaster";

type FlashVariant = "success" | "error" | "info";

type FlashEntry = {
  title: string;
  description?: string;
  variant: FlashVariant;
};

// Registry of allowed flash keys. Toast content lives here — never in the URL.
// Add new entries as new redirect surfaces ship.
const FLASH_REGISTRY: Record<string, FlashEntry> = {
  "listing-created": {
    title: "Listing saved",
    description: "Your draft listing is live in your seller workspace.",
    variant: "success",
  },
  "listing-updated": {
    title: "Listing updated",
    description: "Changes saved. Submit the draft for review when you're ready.",
    variant: "success",
  },
  "listing-submitted": {
    title: "Listing submitted",
    description: "The moderation team has been notified.",
    variant: "success",
  },
};

/**
 * Reads `?flash=<key>` once on mount, fires the matching registered toast, and
 * scrubs the param from the URL with router.replace so a refresh doesn't refire.
 */
export function FlashToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.get("flash");
    if (!key || handledRef.current === key) return;

    const entry = FLASH_REGISTRY[key];
    if (entry) {
      toast(entry);
    }
    handledRef.current = key;

    const next = new URLSearchParams(searchParams.toString());
    next.delete("flash");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}
