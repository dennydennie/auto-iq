"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, postJson } from "@/lib/web-api";

/**
 * Sign the current user out. Clears the HttpOnly session cookie on the API side,
 * then hard-navigates to the sign-in page. `router.refresh()` is not enough here
 * because RSC caches still hold the authenticated view.
 */
export function LogoutButton({
  variant = "ghost",
  size = "sm",
  className,
  redirectTo = "/auth/login",
  label = "Sign out",
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const result = await postJson<{ ok?: true }>("/api/auth/logout");
      if (isApiFailure(result)) {
        toast({
          title: "Couldn't sign out",
          description: result.error.message,
          variant: "error",
        });
        return;
      }
      // Hard reload to guarantee RSC cache is cleared for the authed layout
      window.location.assign(redirectTo);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isPending ? "Signing out..." : label}
    </Button>
  );
}
