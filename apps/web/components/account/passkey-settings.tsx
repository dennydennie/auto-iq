"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getJson, deleteJson, isApiFailure } from "@/lib/web-api";
import { createPasskey, passkeyCancelled, passkeysSupported } from "@/lib/passkey-client";
import { AUTH_COPY as copy } from "@/lib/auth-copy";

type SavedPasskey = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };
export function PasskeySettings() {
  const [supported, setSupported] = useState(false);
  const [items, setItems] = useState<SavedPasskey[] | null>(null);
  const [label, setLabel] = useState(copy.defaultLabel as string);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async () => {
    const result = await getJson<{ data: SavedPasskey[] }>("/api/auth/passkeys");
    if (isApiFailure(result)) { setError(result.error.message); return; }
    setItems(result.data.data);
  }, []);
  useEffect(() => { setSupported(passkeysSupported()); void load(); }, [load]);

  async function create() {
    setBusy(true); setError(null); setNotice(null);
    try { await createPasskey(label); setNotice(copy.passkeyCreated); await load(); }
    catch (problem) { if (!passkeyCancelled(problem)) setError(problem instanceof Error ? problem.message : copy.passkeySetupFailed); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true); setError(null); setNotice(null);
    try {
      const result = await deleteJson(`/api/auth/passkeys/${id}`);
      if (isApiFailure(result)) { setError(result.error.message); return; }
      await load();
    } finally { setBusy(false); }
  }

  return <section className="space-y-4" aria-labelledby="passkeys-heading">
    <h2 id="passkeys-heading" className="text-2xl font-semibold">{copy.passkeys}</h2>
    <p className="max-w-prose">{copy.passkeyDescription}</p>
    {error && <><ErrorBanner message={error} /><Link href="/auth/login?next=/account">{copy.signInAgain}</Link></>}
    {notice && <p role="status">{notice}</p>}
    {items === null ? <Button variant="outline" onClick={load}>{error ? copy.retry : copy.loading}</Button> :
      items.length === 0 ? <p>{copy.noPasskeys}</p> : <ul className="divide-y">
        {items.map(item => <li key={item.id} className="flex items-center justify-between gap-4 py-3">
          <span className="break-words">{item.label || copy.defaultLabel}</span>
          <Button variant="outline" disabled={busy} onClick={() => remove(item.id)}>{copy.remove}</Button>
        </li>)}
      </ul>}
    {supported && <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
      <div className="space-y-2"><Label htmlFor="passkey-label">{copy.passkeyLabel}</Label>
        <Input id="passkey-label" value={label} maxLength={80} disabled={busy} onChange={event => setLabel(event.target.value)} /></div>
      <Button disabled={busy || (items?.length ?? 0) >= 10} onClick={create}>{busy ? copy.creating : copy.createPasskey}</Button>
    </div>}
  </section>;
}
