# Customer authentication

Customers can request a six-digit sign-in code by SMS or email, use a password,
or use an enrolled passkey. Administrators retain password sign-in.

SMS uses the same Gikko Advanced SMS endpoint and approved sender as BluWorx.
Configure `NOTIFICATION_SMS_PROVIDER=gikko`, `GIKKO_SMS_ENABLED=true`,
`GIKKO_SMS_SEND_URL` and `GIKKO_SMS_SENDER` on the API service. Supply
`GIKKO_SMS_API_KEY` through the platform secret store (a GitOps deployment must
use `envSecretRefs`); never place its value in source control. Do not copy
BluWorx delivery callbacks. Production stub delivery is rejected.

Login codes expire after five minutes. Resends require 30 seconds, with three
requests per account in 15 minutes and five verification attempts. Codes are
HMAC hashed in Redis and consumed atomically. Production OTP test mode must
remain disabled. New-account verification retains the existing flow.

Passkeys require an active customer account and recent sign-in (five minutes)
to create or remove credentials. Enrollment binds its challenge to the signed
session; login verifies signature, origin, RP ID and user verification.
Challenges expire after five minutes and cannot be replayed. Credential
queries filter tenant and owner explicitly, with PostgreSQL RLS enforcement.
Passwords and SMS/email remain recovery options. Biometrics stay on the device;
the server stores a public credential key, counters and a user-supplied label.

## Android association

Get the **app-signing certificate** SHA-256 from Auto IQ in Play Console.
The upload certificate alone does not identify a Play-installed app.
Set `AUTO_IQ_ANDROID_CERT_FINGERPRINTS` on production web to the verified
colon-separated SHA-256 fingerprint(s), separated by commas. Set the API's
`PASSKEY_ANDROID_ORIGINS` to `android:apk-key-hash:` followed by each certificate
SHA-256 digest encoded as base64url without padding. Only trusted Auto IQ
certificates belong here. The public `/.well-known/assetlinks.json` must be
served as JSON on `https://bisellautoiq.co.zw` without redirects.

Without verified association configuration the Android UI omits passkeys.
Web passkeys use `WEB_BASE_URL` as their exact trusted origin and hostname RP.
A person must confirm creation on their own device; do not create a production
passkey using a test authenticator.

## Release checks

Build and test API, web and mobile before committing. Deploy the additive
`CreatePasskeyCredentials1761700000000` migration using the compiled release
runner before enabling passkey use. Railway's API image provides
`node apps/api/scripts/run-migrations.js` as its pre-deploy command.
Compare the production readiness route, unauthorized credential-management
responses, passkey RP configuration, existing auth delivery messages,
and domain TLS after deployment. Test real SMS receipt with an owned number;
provider acceptance is not proof of delivery. Build a signed Android release
from clean, pushed source using `scripts/mobile/build-play-bundle.sh`.
