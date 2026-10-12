# Google Play Data Safety working map

This file is an implementation-derived draft for the Play Console form. The
final declaration must be reviewed against the production configuration and
every enabled third-party service.

| Data category       | Example                                 | Purpose                                         | Notes                                                |
| ------------------- | --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Name                | Full name                               | Account management, marketplace identity        | User supplied                                        |
| Email address       | Login and notification email            | Authentication, account recovery, notifications | User supplied                                        |
| Phone number        | Zimbabwe mobile number                  | Authentication, verification, notifications     | User supplied                                        |
| Approximate location | User-selected city                     | Marketplace search and personalization          | Required at registration; no device location permission |
| Address             | Address appearing in uploaded documents | Marketplace verification                        | Optional document uploads                            |
| User IDs            | Internal account and tenant identifiers | Authentication, security, tenant isolation      | Service generated                                    |
| Photos              | Vehicle and inspection photos           | Seller listings and inspections                 | User selected                                        |
| Files and documents | Ownership and vehicle documents         | Listing review and verification                 | User selected                                        |
| Other personal info | Seller identity documents               | Listing functionality and fraud prevention      | Seller ID is required to submit a seller listing     |
| App interactions    | Saves, quotes, requests, and viewings   | Core marketplace workflows                      | Account linked                                       |
| In-app search history | Catalogue search queries              | Marketplace search                              | Optional; request URLs are retained in server logs   |
| Diagnostics         | Crash and error context                 | Reliability and security                        | Sentry only when configured; PII disabled by default |

Current Android manifest permissions: internet access only. The app does not
request device location, contacts, SMS, call log, microphone, or broad storage
permissions.

Data is encrypted in transit. Account deletion can be requested in-app or at
`https://bisellautoiq.co.zw/account-deletion`.

Operators process requests from the role-gated admin deletion queue. Completion
requires recorded identity-verification and data-handling attestations.

Production configuration reviewed on 12 October 2026 uses Railway hosting,
Tigris object storage, SendGrid email, and Sentry API diagnostics. SMS is
configured as a stub, so it does not transmit user data to an SMS vendor.
Mobile Sentry remains disabled unless a DSN is supplied to the release build.
The service-provider and user-initiated transfer exceptions in Google's Data
safety guidance apply to these processing and marketplace flows; no advertising
or marketing data transfer was found.

The corrected questionnaire is saved as a draft in Play Console. Final
submission requires completing reviewer sign-in details and the target-audience
declaration. Retention claims remain limited to the published privacy notice;
no automatic 90-day deletion or independent security certification is claimed.
