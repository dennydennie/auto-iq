# Internationalization scope

## Launch decision

English (`en-ZW`) is the approved launch language. Shona (`sn-ZW`) is enabled for the shared web and mobile navigation/browse vocabulary so translation quality and layout behavior can be exercised with real product copy. Arabic (`ar`) is an engineering preview used to keep right-to-left behavior under automated regression coverage; it is not marketed as a complete Arabic product translation.

Translation of feature-specific forms and operational screens beyond the shared shell and mobile browse surface is deferred until product approves the next launch language and translated copy. This is a scope decision, not a claim that every current English string has been translated.

## Implementation contract

- Web locale selection is stored in the `auto_iq_locale` HttpOnly, same-site cookie.
- The root document resolves the cookie or `Accept-Language` header and sets both `lang` and `dir`.
- Shared navigation and account actions use typed message keys from `apps/web/lib/i18n.ts`.
- Web prices, mileage, dates, counts, and ICU-style plurals use shared locale-aware helpers.
- Mobile declares English, Shona, and Arabic locales, uses Flutter localization delegates, and externalizes the buyer navigation and browse-filter vocabulary.
- New or modified user-facing copy must be added to the appropriate locale resource instead of being embedded directly in a component.

## Verification

`node scripts/check-internationalization.mjs` enforces the web/mobile wiring and rejects inline web `toLocaleString` formatting. Focused web and Flutter tests cover locale resolution, translated strings, plural formatting, locale-aware date/number output, and Arabic right-to-left direction.
