# Phase 8 — Frontend wiring

Point `apps/web` at deployed API:

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api-staging.up.railway.app` (no trailing slash) |

`ApiClient` `baseUrl` = origin only; paths still from `ROUTES` (`/api/v1/...`).

## CORS / cookies

- Production `CORS_ORIGINS` must include web origin
- Web API calls use `credentials: 'include'`
- Cookie flags must match [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) and the real web/API origin relationship; use `SameSite=None; Secure` only when cross-site deployment requires it
- Unsafe cookie-authenticated calls send `X-CSRF-Token`

## Smoke (manual)

| Screen | Calls |
| --- | --- |
| Login | `ROUTES.auth.login` |
| Browse | `ROUTES.catalogue.list` |
| Listing detail | `ROUTES.catalogue.detail` |

See [testing.md](./testing.md) S8.x / P8.x.
