"use client";

import { useState, useTransition } from "react";
import type { ConsentType, UserRole } from "@auto-iq/contracts/enums";
import type {
  ConsentsResponse,
  RecordConsentRequest,
} from "@auto-iq/contracts/identity";
import { ArrowRight } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isApiFailure, postJson } from "@/lib/web-api";

const CONSENT_VERSION = "1.0.0";
const COPY: Record<ConsentType, string> = {
  TERMS: "I accept the platform terms of use.",
  PRIVACY: "I accept the privacy notice and account data handling terms.",
  SELLER_RULES:
    "I accept the seller listing, inspection, and moderation rules.",
  BUYER_RULES: "I accept the buyer quote, viewing, and marketplace rules.",
  NO_SIDE_DEAL: "I agree not to bypass the platform for side deals.",
};

export function RecordConsentsForm({ roles }: { roles: UserRole[] }) {
  const required = requiredConsents(roles);
  const [accepted, setAccepted] = useState<ConsentType[]>([]);
  const [error, setError] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      for (const consentType of required) {
        const result = await postJson<ConsentsResponse>("/api/me/consents", {
          consentType,
          version: CONSENT_VERSION,
          accepted: true,
        } satisfies RecordConsentRequest);
        if (isApiFailure(result)) {
          setError(result.error);
          return;
        }
      }
      window.location.assign(roles.includes("SELLER") ? "/seller" : "/");
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? (
        <ErrorBanner
          message={error.message}
          correlationId={error.correlationId}
        />
      ) : null}
      {required.map((consent) => (
        <Checkbox
          key={consent}
          checked={accepted.includes(consent)}
          onChange={(event) =>
            setAccepted((current) =>
              event.target.checked
                ? [...current, consent]
                : current.filter((value) => value !== consent),
            )
          }
          label={COPY[consent]}
        />
      ))}
      <Button
        className="w-full"
        variant="amber"
        type="submit"
        disabled={isPending || accepted.length !== required.length}
      >
        {isPending ? "Saving agreements..." : "Accept and continue"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

function requiredConsents(roles: UserRole[]): ConsentType[] {
  const roleConsents: ConsentType[] = [];
  if (roles.includes("BUYER")) roleConsents.push("BUYER_RULES");
  if (roles.includes("SELLER")) roleConsents.push("SELLER_RULES");
  return ["TERMS", "PRIVACY", ...roleConsents, "NO_SIDE_DEAL"];
}
