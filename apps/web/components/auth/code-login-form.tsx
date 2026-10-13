"use client";
import { useEffect, useState } from "react";
import { OtpForm } from "./otp-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { postJson, isApiFailure } from "@/lib/web-api";
import { AUTH_COPY as copy } from "@/lib/auth-copy";
import { passkeysSupported, signInWithPasskey, passkeyCancelled } from "@/lib/passkey-client";

type Channel = "SMS" | "EMAIL";

export function CodeLoginForm({ onPassword, defaultIdentifier = "", nextHref }: {
  onPassword: () => void; defaultIdentifier?: string; nextHref?: string;
}) {
  const [codeIdentifier, setCodeIdentifier] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>(defaultIdentifier.includes("@") ? "EMAIL" : "SMS");
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [busy, setBusy] = useState(false);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setPasskeyReady(passkeysSupported()), []);

  async function send(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const result = await postJson("/api/auth/login-code/request", { identifier: normalizeIdentifier(identifier, channel), channels: [channel] });
      if (isApiFailure(result)) { setError(result.error.message); return; }
      setCodeIdentifier(normalizeIdentifier(identifier, channel));
    } finally { setBusy(false); }
  }

  async function passkeyLogin() {
    setBusy(true); setError(null);
    try {
      const user = await signInWithPasskey();
      const fallback = user.role === "SELLER" ? "/seller" : user.role === "INSPECTOR" ? "/inspector/tasks" : "/";
      window.location.assign(nextHref ?? fallback);
    } catch (problem) { if (!passkeyCancelled(problem)) setError(copy.passkeyFallback); }
    finally { setBusy(false); }
  }

  if (codeIdentifier) return <div className="space-y-5">
    <h2 className="text-2xl font-semibold">{copy.enterCode}</h2>
    <OtpForm identifier={codeIdentifier} purpose="login" channel={channel} nextHref={nextHref} />
    <Button type="button" variant="ghost" onClick={() => setCodeIdentifier(null)}>{copy.backToSignIn}</Button>
  </div>;

  return <form onSubmit={send} className="space-y-5">
    {error && <ErrorBanner message={error} />}
    <p>{copy.codeDescription}</p>
    <fieldset disabled={busy} className="flex gap-5"><legend className="sr-only">{copy.codeDescription}</legend>
      {(["SMS", "EMAIL"] as const).map(value => <label key={value} className="flex items-center gap-2">
        <input type="radio" name="login-channel" checked={channel === value} onChange={() => { setChannel(value); setIdentifier(""); setError(null); }} />
        {value === "SMS" ? copy.sms : copy.email}
      </label>)}
    </fieldset>
    <div className="space-y-2"><Label htmlFor="code-login-identifier">{channel === "SMS" ? copy.phone : copy.emailAddress}</Label>
      <Input id="code-login-identifier" value={identifier} disabled={busy} required type={channel === "SMS" ? "tel" : "email"}
        autoComplete="username webauthn" placeholder={channel === "SMS" ? "+263…" : "you@example.com"}
        onChange={event => setIdentifier(event.target.value)} /></div>
    <Button type="submit" disabled={busy} className="w-full">{busy ? copy.sending : copy.getCode}</Button>
    {passkeyReady && <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={passkeyLogin}>{copy.passkey}</Button>}
    <Button type="button" variant="ghost" disabled={busy} className="w-full" onClick={onPassword}>{copy.password}</Button>
  </form>;
}

function normalizeIdentifier(value: string, channel: Channel) {
  if (channel === "EMAIL") return value.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  return value.trim().startsWith("+") || digits.startsWith("263") ? `+${digits}` : `+263${digits.replace(/^0/, "")}`;
}
