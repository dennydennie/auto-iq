"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@auto-iq/contracts/identity";
import { ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { isApiFailure, postJson } from "@/lib/web-api";

export function ActivateSellerButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function activateSeller() {
    setError(null);
    startTransition(async () => {
      const result = await postJson<MeResponse>("/api/me/seller-profile");
      if (isApiFailure(result)) {
        setError(result.error.message);
        return;
      }
      router.push("/onboarding/consents?mode=seller");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorBanner message={error} /> : null}
      <Button
        type="button"
        variant="amber"
        className="w-full sm:w-auto"
        disabled={isPending}
        onClick={activateSeller}
      >
        {isPending ? "Activating seller tools" : "Start selling with this account"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
