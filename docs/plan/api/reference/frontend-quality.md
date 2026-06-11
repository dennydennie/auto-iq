# Frontend Quality Gate

These rules apply to every phase that changes `apps/web`.

## Accessibility

- Use semantic HTML regions: `header`, `nav`, `main`, `section`, `form`, and `button` where appropriate.
- Every form input has a visible label or an intentional accessible name.
- Interactive controls are keyboard reachable and preserve visible focus.
- Do not use ARIA to mask non-semantic markup when native elements work.
- Error, status, loading, and empty states are announced or discoverable without relying on color alone.
- Images and icons have useful alt text or are marked decorative.

## Internationalization

- Do not hardcode user-facing strings directly in components introduced or modified by the phase.
- Externalize labels, validation messages, status text, notification copy, and empty states through the agreed web copy/i18n layer.
- Format dates, times, prices, mileage, and counts through shared formatting helpers.
- Avoid layout assumptions that break right-to-left languages.

## Contract and state

- Server data comes from `@auto-iq/contracts` types and `ROUTES`.
- Prefer server-rendered data where practical; use client state only for local UI interactions.
- Lists use the pagination style documented in [frontend-contract.md](./frontend-contract.md).
- Mutation errors surface `ApiError.code`, `message`, and `correlationId`.
