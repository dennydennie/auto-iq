"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getJson } from "@/lib/web-api";
import { AUTH_COPY as copy } from "@/lib/auth-copy";
import { createPasskey, passkeyCancelled, passkeysSupported } from "@/lib/passkey-client";

export function PasskeyOffer({ accountId }: { accountId: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function offer() {
      try {
        if (!passkeysSupported() || sessionStorage.getItem("auto-iq.passkey-offer") !== accountId) return;
        sessionStorage.removeItem("auto-iq.passkey-offer");
        if (localStorage.getItem(`auto-iq.passkey-declined.${accountId}`)) return;
        const result = await getJson<{ data: unknown[] }>("/api/auth/passkeys");
        if (active && result.ok && result.data.data.length === 0) setVisible(true);
      } catch { /* Optional enrollment must never prevent ordinary sign-in. */ }
    }
    void offer(); return () => { active = false; };
  }, [accountId]);

  function decline() {
    try { localStorage.setItem(`auto-iq.passkey-declined.${accountId}`, "1"); } catch { /* The account settings route remains available. */ }
    setVisible(false);
  }
  async function create() {
    setBusy(true); setMessage(null);
    try { await createPasskey(copy.defaultLabel); setVisible(false); }
    catch (error) { if (!passkeyCancelled(error)) setMessage(error instanceof Error ? error.message : copy.passkeySetupFailed); }
    finally { setBusy(false); }
  }
  if (!visible) return null;
  return <section className="mx-auto max-w-5xl space-y-3 px-6 py-6" aria-labelledby="passkey-offer-title">
    <h2 id="passkey-offer-title" className="text-2xl font-semibold">{copy.passkeyOffer}</h2>
    <p>{copy.passkeyDescription}</p>
    {message && <p role="alert">{message}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={create}>{busy ? copy.creating : copy.createPasskey}</Button>
      <Button variant="outline" disabled={busy} onClick={decline}>{copy.later}</Button></div>
  </section>;
}
