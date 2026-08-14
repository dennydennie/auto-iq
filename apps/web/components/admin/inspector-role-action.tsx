"use client";

import type { AdminUserDto } from "@auto-iq/contracts/admin";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson } from "@/lib/web-api";

export function InspectorRoleAction({ user }: { user: AdminUserDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const granted = user.roles.includes("INSPECTOR");

  function updateRole() {
    startTransition(async () => {
      const result = await patchJson<AdminUserDto>(
        `/api/admin/users/${user.id}/roles/inspector`,
        { granted: !granted },
      );
      if (isApiFailure(result)) {
        toast({
          title: "Inspector role update failed",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      showSuccess(result.data, !granted);
      router.refresh();
    });
  }

  function showSuccess(updated: AdminUserDto, isGranted: boolean) {
    toast({
      title: isGranted ? "Inspector role granted" : "Inspector role revoked",
      description: `${updated.fullName}'s workspace access has been updated.`,
      variant: "success",
    });
  }

  return (
    <Button
      variant={granted ? "outline" : "secondary"}
      size="sm"
      disabled={isPending || !user.accessActive}
      onClick={updateRole}
      aria-label={`${granted ? "Revoke" : "Grant"} Inspector role for ${user.fullName}`}
    >
      {isPending ? "Saving…" : granted ? "Revoke Inspector" : "Grant Inspector"}
    </Button>
  );
}
