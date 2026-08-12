# Privacy, retention, and deletion review

- Engineering review completed: 12 August 2026
- Formal legal approval: required before public production launch

This document records what the product currently implements and the decisions
an authorised legal or privacy owner must approve. It is not a substitute for
legal advice or an approval issued by a qualified person.

## Implemented controls

- Public privacy notice at `/privacy`.
- Public deletion request form at `/account-deletion`.
- Signed-in deletion request controls on web and mobile.
- Generic public acknowledgement to prevent account enumeration.
- Tenant-isolated deletion request records with rate limiting and audit logs.
- Role-gated admin queue with atomic processing decisions.
- Completion requires identity-verification and data-handling attestations.
- Cancellation and completion notes are recorded in the admin action log.
- Historical decisions remain visible without fabricated attestations when they
  predate the evidence fields.

## Retention decisions requiring approval

| Record | Current implementation | Approval needed |
| --- | --- | --- |
| Active account and profile | Kept while the account is active | Confirm lawful basis and account lifecycle |
| Session | Redis session expires after seven days | Confirm session retention |
| Deletion request | Kept as restricted operational evidence | Set the evidence-retention period |
| Listings, quotes, and viewings | May be retained for transaction, fraud, security, or dispute handling | Set category-specific periods and de-identification rules |
| Ownership and inspection files | Stored in object storage with tenant controls | Set deletion and legally required retention rules |
| Audit and security records | Kept for traceability and abuse prevention | Set security-log retention |
| Diagnostics | Controlled by the production Sentry configuration | Confirm vendor, region, and retention |

## Approval record

Before launch, the approving owner should record:

- legal entity and privacy contact;
- applicable jurisdictions;
- lawful bases and user rights;
- category-specific retention periods;
- subprocessors and international transfers;
- deletion and de-identification rules for transactional records;
- production Data Safety answers;
- approver name, role, date, and policy version.

The public notice must be updated whenever an approved decision changes the
implemented wording or data lifecycle.
