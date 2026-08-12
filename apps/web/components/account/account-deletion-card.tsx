"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { AccountDeletionRequestResponse } from "@auto-iq/contracts/identity";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { isApiFailure, postJson } from "@/lib/web-api";

export function AccountDeletionCard() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestDeletion() {
    startTransition(async () => {
      const result = await postJson<AccountDeletionRequestResponse>(
        "/api/me/account-deletion-requests",
        { client: "WEB" },
      );
      if (isApiFailure(result)) {
        setError(result.error.message);
        setConfirming(false);
        return;
      }
      window.location.assign("/account-deletion?requested=1");
    });
  }

  return (
    <Card className="border-[var(--reject)]/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-[var(--reject)]" aria-hidden="true" />
          Delete account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-[var(--ink-500)]">
          Request deletion of your AutoIQ account and associated personal data.
          The team will verify and process the request, subject to any records
          that must be retained for security or legal obligations.
        </p>
        {error ? <ErrorBanner message={error} /> : null}
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => setConfirming(true)}
        >
          Request account deletion
        </Button>
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={requestDeletion}
          title="Request account deletion?"
          description="This sends a deletion request and signs you out. The team may contact you to verify account ownership before processing it."
          confirmLabel="Send deletion request"
          busy={isPending}
        />
      </CardContent>
    </Card>
  );
}
