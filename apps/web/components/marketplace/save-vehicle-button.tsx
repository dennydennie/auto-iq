"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Lock } from "lucide-react";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { deleteJson, isApiFailure, postJson } from "@/lib/web-api";

/**
 * Heart toggle that persists a saved vehicle for the current buyer.
 * When rendered for an anonymous viewer it renders a Sign-in link that
 * round-trips back to the listing.
 */
export function SaveVehicleButton({
  listingId,
  listingSlugOrId,
  initialSaved,
  signedIn,
  variant = "ghost",
  size = "icon",
  iconOnly = false,
  className,
}: {
  listingId: string;
  /** Slug or id used to build the /vehicles/:x return URL after sign-in. */
  listingSlugOrId?: string;
  initialSaved: boolean;
  signedIn: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  iconOnly?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    const target = listingSlugOrId ?? listingId;
    const href = `/auth/login?next=${encodeURIComponent(`/vehicles/${target}`)}`;
    return (
      <a
        href={href}
        aria-label="Sign in to save this vehicle"
        className={cn(
          buttonVariants({ variant, size }),
          "text-white/85 hover:text-white",
          className,
        )}
      >
        <Lock className="h-4 w-4" aria-hidden="true" />
        {iconOnly ? null : <span>Sign in to save</span>}
      </a>
    );
  }

  function toggle() {
    const nextSaved = !saved;
    setSaved(nextSaved); // optimistic
    startTransition(async () => {
      const result = nextSaved
        ? await postJson<void>(`/api/me/saved-vehicles/${listingId}`)
        : await deleteJson<void>(`/api/me/saved-vehicles/${listingId}`);

      if (isApiFailure(result)) {
        // Revert
        setSaved(!nextSaved);
        toast({
          title: nextSaved ? "Couldn't save" : "Couldn't unsave",
          description: result.error.message,
          variant: "error",
        });
        return;
      }

      toast({
        title: nextSaved ? "Saved" : "Removed from saved",
        description: nextSaved
          ? "Find it later in your saved list."
          : "The vehicle is no longer in your saved list.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save vehicle"}
      className={className}
    >
      <Heart
        className={cn("h-4 w-4 transition", saved ? "fill-current text-[var(--reject)]" : "")}
        aria-hidden="true"
      />
      {iconOnly ? null : <span>{saved ? "Saved" : "Save"}</span>}
    </Button>
  );
}
