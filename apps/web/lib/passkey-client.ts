import { startAuthentication, startRegistration, browserSupportsWebAuthn,
  type PublicKeyCredentialCreationOptionsJSON, type PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import type { LoginResponse } from "@auto-iq/contracts/identity";
import { postJson, isApiFailure } from "./web-api";

type Options<T> = { challengeId: string; options: T };

export function passkeysSupported() { return typeof window !== "undefined" && browserSupportsWebAuthn(); }

export async function signInWithPasskey() {
  const offered = await postJson<Options<PublicKeyCredentialRequestOptionsJSON>>("/api/auth/passkeys/login/options", {});
  if (isApiFailure(offered)) throw new Error(offered.error.message);
  const response = await startAuthentication({ optionsJSON: offered.data.options });
  const result = await postJson<LoginResponse>("/api/auth/passkeys/login/verify", {
    challengeId: offered.data.challengeId, response,
  });
  if (isApiFailure(result)) throw new Error(result.error.message);
  return result.data;
}

export async function createPasskey(label: string) {
  const offered = await postJson<Options<PublicKeyCredentialCreationOptionsJSON>>("/api/auth/passkeys/registration/options", {});
  if (isApiFailure(offered)) throw new Error(offered.error.message);
  const response = await startRegistration({ optionsJSON: offered.data.options });
  const result = await postJson("/api/auth/passkeys/registration/verify", {
    challengeId: offered.data.challengeId, response, label,
  });
  if (isApiFailure(result)) throw new Error(result.error.message);
}

export function passkeyCancelled(error: unknown) {
  return error instanceof Error && ["NotAllowedError", "AbortError"].includes(error.name);
}

export function rememberPasskeyOffer(accountId: string) {
  try { sessionStorage.setItem("auto-iq.passkey-offer", accountId); } catch { /* Storage is optional. */ }
}
