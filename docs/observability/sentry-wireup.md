# Sentry wire-up for `apps/web`

Sandbox environments block the npm install, so the SDK isn't in `package.json`
yet. Everything the SDK expects is already staged — installing the package
alone should light Sentry up.

## One-time install

```bash
cd /Users/dennismarumahoko/Documents/GitHub/Auto IQ
pnpm add -F @autoiq/web @sentry/nextjs
```

That's it structurally — `apps/web/next.config.ts` already wraps the config
through a `require("@sentry/nextjs").withSentryConfig` guard that no-ops when
the SDK isn't installed and activates when it is.

## Environment variables

Populate these in every runtime (`.env.local`, Railway, Vercel, etc.). They
were reserved in `.env.example` during the launch-blocker pass.

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://abc@o12345.ingest.sentry.io/67890` | DSN used by the browser SDK. |
| `SENTRY_DSN` | same as above | Server / edge runtime. |
| `SENTRY_ORG` | `bisell-autoiq` | Used by `withSentryConfig` for source map upload. |
| `SENTRY_PROJECT` | `web` | Same. |
| `SENTRY_AUTH_TOKEN` | `sntrys_...` | **Build time only.** Set on the CI/deploy image, not runtime. |
| `SENTRY_ENVIRONMENT` | `staging` \| `production` | Optional — overrides `NEXT_PUBLIC_APP_ENV`. |
| `SENTRY_RELEASE` | `git-sha-here` | Optional — falls back to the auto-detected release. |

## Init config files to add after install

Create these three files at `apps/web/` (Next.js reads them automatically):

### `sentry.client.config.ts`

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
  // Session replay is off until we've talked to Privacy about buyer session recording.
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});
```

### `sentry.server.config.ts`

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
});
```

### `sentry.edge.config.ts`

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
});
```

## Wire the error boundaries

Once the SDK is installed, replace the two `console.error(...)` calls in the
error boundaries with a real Sentry capture:

- `apps/web/app/error.tsx`
- `apps/web/app/global-error.tsx`

```ts
useEffect(() => {
  Sentry.captureException(error);
  console.error("[route error]", error);
}, [error]);
```

The existing `error.digest` is Next.js' opaque handle — Sentry ties it to the
event automatically once the client SDK is initialised, so no extra tagging is
required.

## Correlation IDs

`packages/contracts/src/error.ts` guarantees every ApiError has a
`correlationId`. Where we surface errors in the UI (`ErrorBanner`) we already
render the value. To tie API failures to the Sentry event, wrap the client-side
call sites that surface an ApiError like this:

```ts
if (isApiFailure(result)) {
  Sentry.withScope((scope) => {
    scope.setTag("correlationId", result.error.correlationId ?? "");
    scope.setTag("code", result.error.code);
    Sentry.captureMessage(`API failure: ${result.error.code}`);
  });
}
```

## Verify

1. Deploy staging with the env vars set.
2. Visit `/vehicles/does-not-exist`. The `not-found.tsx` renders — no Sentry
   event should fire (404 is expected).
3. Temporarily add `throw new Error("sentry smoke")` inside a page's server
   component. Visit the page. Confirm Sentry receives an event with the release
   SHA and the environment tag.
4. Roll the smoke throw back.

That satisfies **Gate 1 (staging auto-deploy)** in
[`docs/operations/go-live-checklist.md`](../operations/go-live-checklist.md) —
"Controlled Sentry event was received with `environment=staging` and the
release SHA."
