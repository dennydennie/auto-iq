# Google Play Data Safety working map

This file is an implementation-derived draft for the Play Console form. The
final declaration must be reviewed against the production configuration and
every enabled third-party service.

| Data category       | Example                                 | Purpose                                         | Notes                                                |
| ------------------- | --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Name                | Full name                               | Account management, marketplace identity        | User supplied                                        |
| Email address       | Login and notification email            | Authentication, account recovery, notifications | User supplied                                        |
| Phone number        | Zimbabwe mobile number                  | Authentication, verification, notifications     | User supplied                                        |
| Address or location | City and selected viewing location      | Marketplace search and viewings                 | No device location permission                        |
| User IDs            | Internal account and tenant identifiers | Authentication, security, tenant isolation      | Service generated                                    |
| Photos              | Vehicle and inspection photos           | Seller listings and inspections                 | User selected                                        |
| Files and documents | Ownership and vehicle documents         | Listing review and verification                 | User selected                                        |
| App interactions    | Saves, quotes, requests, and viewings   | Core marketplace workflows                      | Account linked                                       |
| Diagnostics         | Crash and error context                 | Reliability and security                        | Sentry only when configured; PII disabled by default |

Current Android manifest permissions: internet access only. The app does not
request device location, contacts, SMS, call log, microphone, or broad storage
permissions.

Data is encrypted in transit. Account deletion can be requested in-app or at
`<production-web-origin>/account-deletion`.
