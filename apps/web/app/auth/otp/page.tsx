import { OtpForm } from "@/components/auth/otp-form";
import { AuthShell } from "@/components/shared/auth-shell";
import { authDestination } from "@/lib/auth-proxy";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function value(input: string | string[] | undefined) { return Array.isArray(input) ? input[0] : input; }
export default async function OtpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const identifier = value(params.identifier) ?? null;
  const login = value(params.purpose) === "login";
  const channel = value(params.channel) === "EMAIL" ? "EMAIL" : "SMS";
  return <AuthShell title="Enter your sign-in code"
    description="Use the six-digit code to securely access your Auto IQ account."
    ctaLabel="Back to sign in" ctaHref="/auth/login"
    highlight={<p>Codes expire after five minutes. You can request a new code if yours does not arrive.</p>}>
    <div className="space-y-6"><h2 className="text-2xl font-semibold">Enter the six-digit code</h2>
      <p>Check {login ? (channel === "SMS" ? "your SMS inbox" : "your email inbox") : "your SMS and email inboxes"} for the code for {identifier}.</p>
      <OtpForm identifier={identifier} autoSend={!login && value(params.registered) === "1"}
        purpose={login ? "login" : "registration"} channel={channel} nextHref={authDestination(value(params.next))} />
    </div>
  </AuthShell>;
}
