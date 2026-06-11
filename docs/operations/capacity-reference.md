# Capacity Reference

## Pool sizing

- Keep API DB pool below provider connection limits.
- Start with conservative Postgres pool sizing for a single API replica.
- Increase only after observing real concurrency and query duration.

## Redis memory

Main consumers:

- sessions
- CSRF state
- OTP state
- rate limits
- upload intents

Eviction policy should not silently drop active session keys. Monitor memory growth after enabling reminders and retries.

## Queue hotspots

- submitted listings
- inspection queue
- pending notifications
- confirmed viewings for reminder scans

Partial indexes for queue-heavy tables are already in schema and should be kept aligned with actual filters.
