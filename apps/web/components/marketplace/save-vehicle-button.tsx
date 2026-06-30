"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import type { SavedVehicleDto } from "@auto-iq/contracts/catalogue";
import { Button } from "@/components/ui/button";
import { isApiFailure, postJson } from "@/lib/web-api";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveVehicleButton({
  compact = false,
  listingId,
}: {
  compact?: boolean;
  listingId: string;
}) {
  const [state, setState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();

  function saveVehicle() {
    setState("saving");
    startTransition(async () => {
      const result = await postJson<SavedVehicleDto>(`/api/buyer/saved-vehicles/${listingId}`);
      setState(isApiFailure(result) ? "error" : "saved");
    });
  }

  const saved = state === "saved";
  const pending = isPending || state === "saving";
  const label = saved ? "Saved" : pending ? "Saving" : "Save";

  return (
    <div className={compact ? "flex flex-col items-end" : "flex flex-col"}>
      <Button
        type="button"
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon" : "sm"}
        className={
          compact
            ? "rounded-full bg-white/8 text-white hover:bg-white/16"
            : "w-full justify-center"
        }
        disabled={saved || pending}
        onClick={saveVehicle}
        aria-label={saved ? "Vehicle saved" : "Save vehicle"}
      >
        <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        {compact ? null : label}
      </Button>
      {state === "error" ? (
        <span className="mt-1 text-[10px] font-semibold text-[var(--reject)]">
          Try again
        </span>
      ) : null}
    </div>
  );
}
