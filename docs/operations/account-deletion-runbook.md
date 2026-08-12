# Account deletion operations

Use the role-gated admin page at `/admin/account-deletions`. Never place
identity documents, passwords, secrets, or unnecessary personal data in the
processing note.

## Complete a request

1. Confirm the request is still `PENDING`.
2. Verify that the requester controls the account using an approved method.
3. Suspend account access while processing.
4. Apply the approved retention schedule to account, profile, marketplace,
   document, notification, diagnostic, and vendor-held data.
5. Delete personal data that has no approved retention basis.
6. De-identify retained records and restrict them to their documented purpose.
7. Record a concise evidence note without copying sensitive source material.
8. Check both operator attestations and mark the request `COMPLETED`.

The completion action records evidence; it does not silently perform destructive
database or object-storage deletion. This separation prevents an admin click
from erasing transactional or legally retained records without review.

## Cancel a request

Cancel only when the requester withdraws it, ownership cannot be verified, or
an authorised policy owner directs cancellation. Record the reason and any
follow-up action, then mark the request `CANCELLED`.

## Concurrency and audit behaviour

- Only an active admin can access the queue.
- CSRF protection applies to every processing decision.
- The first operator decision wins atomically.
- Later attempts return a conflict instead of overwriting evidence.
- Completion is rejected unless both attestations are true.
- Every successful decision is written to general and admin audit logs.
