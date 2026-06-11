# ADR 0005: Mandatory Seller Documents (MVP)

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product + Legal |
| Date | 2026-06-09 |
| Revisit | 2026-12-01 |

## Decision

The following document types are mandatory to submit a listing into `SUBMITTED` review state:

- `DOCUMENT_TYPES.REGISTRATION_BOOK`
- `DOCUMENT_TYPES.SELLER_ID`
- `DOCUMENT_TYPES.PURCHASE_IMPORT_DOCS`

All three documents must have valid storage metadata and presign/registration success before `POST /api/v1/listings/:id/submit` succeeds.

## Consequences

- Wizard Step 4 in seller flows enforces all three types as required.
- `DocumentPresignRequest.documentType` values outside this set are optional in later listing lifecycle stages.
- Missing one or more required document types returns `WIZARD_INCOMPLETE`.

## Contract impact

- `packages/contracts` upload helpers remain unchanged.
- Validation in phase 3 enforcement must use required set above for status transition checks and audit notes.

