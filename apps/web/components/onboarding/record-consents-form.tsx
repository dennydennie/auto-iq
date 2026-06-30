"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ConsentType } from "@auto-iq/contracts/enums";
import type { ConsentsResponse, RecordConsentRequest } from "@auto-iq/contracts/identity";
import { ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isApiFailure, postJson } from "@/lib/web-api";

const CONSENT_VERSION = "1.0.0";

const REQUIRED_CONSENTS: Array<{ type: ConsentType; label: string }> = [
  { type: "TERMS", label: "Platform terms for account, listing, and marketplace operations." },
  { type: "PRIVACY", label: "Privacy handling for verification, communication, and workflow records." },
  { type: "BUYER_RULES", label: "Buyer rules covering saved vehicles, quotes, requests, and viewings." },
  { type: "SELLER_RULES", label: "Seller rules covering drafts, review, publishing, and buyer activity." },
  { type: "NO_SIDE_DEAL", label: "No-side-deal commitment so transactions stay traceable and fair." },
];

function consentPayload(type: ConsentType): RecordConsentRequest {
  return { accepted: true, consentType: type, version: CONSENT_VERSION };
}

export function RecordConsentsForm() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      setError("Accept the operating agreements before continuing.");
      return;
    }
    setError(null);
    startTransition(recordConsents);
  }

  async function recordConsents() {
    for (const consent of REQUIRED_CONSENTS) {
      const result = await postJson<ConsentsResponse>("/api/me/consents", consentPayload(consent.type));
      if (isApiFailure(result)) {
        setError(result.error.message);
        return;
      }
    }
    router.push("/seller");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="space-y-3">
        {REQUIRED_CONSENTS.map((consent) => (
          <div key={consent.type} className="rounded-[1rem] border border-[var(--ink-100)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--amber-dark)]">
              {consent.type.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">{consent.label}</p>
          </div>
        ))}
      </div>
      <Checkbox
        checked={accepted}
        onChange={(event) => setAccepted(event.target.checked)}
        label="I accept these buyer and seller operating agreements for this account."
      />
      <Button type="submit" variant="amber" className="w-full" disabled={isPending}>
        {isPending ? "Recording agreements" : "Accept and continue to seller tools"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
