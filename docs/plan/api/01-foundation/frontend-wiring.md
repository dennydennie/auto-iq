# Phase 1 — Frontend wiring

Contracts: `@auto-iq/contracts` (`error`, `client`). Global rules: [frontend-contract.md](../reference/frontend-contract.md).

## Headers (establish in web API layer)

| Header | When |
| --- | --- |
| `Content-Type: application/json` | All JSON requests |
| `Accept: application/json` | All requests |
| `credentials: 'include'` | All `apps/web` API calls that may use cookies |
| `X-CSRF-Token` | Unsafe cookie-authenticated methods after Phase 2 CSRF route exists |
| `X-Correlation-Id` | Optional UUID per request |

## Endpoints

| Method | `ROUTES` constant | Auth | Query | Body | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `health.live` | No | — | — | `{ status: 'ok' }` |
| GET | `health.ready` | No | — | — | Readiness JSON (db/redis/storage flags) |

## Error handling

Parse failures as `ApiError`:

```typescript
import type { ApiError } from '@auto-iq/contracts';

if (!result.ok) {
  const { code, message, correlationId, details } = result.error;
}
```

Use `ApiClient` from `@auto-iq/contracts/client` for typed `ApiResult<T>`.

## Web setup checklist

- [ ] `NEXT_PUBLIC_API_URL` → `ApiClient` `baseUrl` + `/api/v1` paths via `ROUTES`
- [ ] Central `api` module wrapping `ApiClient`
- [ ] Browser API layer defaults to `credentials: 'include'`; no browser JWT persistence
- [ ] Display `correlationId` on error toasts for support
- [ ] New/changed web surfaces follow [frontend-quality.md](../reference/frontend-quality.md)
