"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ViewingDto } from "@auto-iq/contracts/viewings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

export function SellerViewingAction({ viewing }: { viewing: ViewingDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function acknowledge() {
    startTransition(async () => {
      const result = await postJson<ViewingDto>(
        `/api/seller/viewings/${viewing.id}/seller-confirm`,
      );
      if (isApiFailure(result)) {
        toast({
          title: "Couldn't acknowledge viewing",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      toast({
        title: "Viewing acknowledged",
        description: "The operations team can now confirm the appointment.",
        variant: "success",
      });
      router.refresh();
    });
  }

  if (viewing.status !== "REQUESTED") return null;
  return (
    <Button variant="amber" disabled={isPending} onClick={acknowledge}>
      {isPending ? "Saving..." : "Acknowledge request"}
    </Button>
  );
}
