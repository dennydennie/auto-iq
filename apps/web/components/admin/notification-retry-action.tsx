"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationDto } from "@auto-iq/contracts/notifications";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

export function NotificationRetryAction({
  notification,
}: {
  notification: NotificationDto;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  if (notification.status !== "FAILED" && notification.status !== "DEAD_LETTER")
    return null;

  function retry() {
    startTransition(async () => {
      const result = await postJson<NotificationDto>(
        `/api/admin/notifications/${notification.id}/retry`,
      );
      if (isApiFailure(result)) {
        toast({
          title: "Retry failed",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      toast({
        title: "Retry queued",
        description: "Delivery status has been refreshed.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={retry} disabled={isPending}>
      {isPending ? "Retrying..." : "Retry delivery"}
    </Button>
  );
}
