# ADR 0006: Buyer-Facing Inspection Fields

| Field | Value |
| --- | --- |
| Status | Accepted |
| Owner | Product + Operations |
| Date | 2026-06-09 |
| Revisit | 2026-10-01 |

## Decision

Buyer visibility for inspections is restricted to `BuyerInspectionSummaryDto` and must include only the following allowlist:

- `inspectionDate`
- `inspectorName`
- `overallScore`
- `roadworthy`
- `categories` (category-level score rollups)
- `findings` (buyer-safe findings list)
- `inspectorNote`

No raw internal photos, raw VIN fields, private checklists, or unresolved draft findings are exposed to buyers.

## Consequences

- `catalogue.inspectionSummary` is read-only for all guests and buyers.
- Inspector/admin internal capture screens can keep richer models, but only approved summary fields are projected to this DTO.
- Approval of buyer summary (`POST /api/v1/admin/listings/:id/inspection-summary/approve`) gates whether this projection is available.

## Contract impact

- `PublicListingDto.inspectionSummary` remains nullable.
- Internal report details stay in admin-only modules in phase 4/6.

