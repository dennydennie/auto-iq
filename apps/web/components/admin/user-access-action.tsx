"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminUserDto } from "@auto-iq/contracts/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson } from "@/lib/web-api";

export function UserAccessAction({ user }: { user: AdminUserDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function updateAccess() {
    startTransition(async () => {
      const result = await patchJson<AdminUserDto>(
        `/api/admin/users/${user.id}/access`,
        { active: !user.accessActive },
      );
      if (isApiFailure(result)) {
        toast({ title: "Access update failed", description: result.error.message, variant: "error" });
        return;
      }
      toast({
        title: result.data.accessActive ? "Access restored" : "Access suspended",
        description: `${result.data.fullName}'s tenant access has been updated.`,
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <Button
      variant={user.accessActive ? "destructive" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={updateAccess}
    >
      {isPending ? "Saving…" : user.accessActive ? "Suspend" : "Restore"}
    </Button>
  );
}
