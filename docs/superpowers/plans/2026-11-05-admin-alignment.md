# Admin and super-admin alignment

User scope: retain existing design and data flows, apply the storefront blue/gray/silver/white palette, improve positioning and content alignment, and use right-side drawers for add/edit workflows.

## Implementation

- Preserve existing sidebar, role-based navigation, cards and tables. Use stable desktop columns, bounded table scrolling, consistent header/action alignment, spacing and typography.
- Reuse one accessible right-side dialog for product creation, category creation, slider/banner creation/editing, customer details, and existing order/payment/invoice details. On mobile it fills the viewport; its body scrolls independently of the header.
- Keep backend calls, request payloads, role guards and form validation intact. Block closing forms while saving, retain draft/error state, trap keyboard focus, restore focus to the trigger and lock background scrolling.
- Preserve `/admin/products/new` as a direct entry to the product drawer over the catalog.

## Verification

Browser checks use isolated API fixtures, with no live mutations. Check nine console pages at 360/768/1024/1440px, eight drawer workflows, edit prefilling, close/Escape, focus trap/restoration, scroll locking, failed/pending save behavior, direct links and draft preservation. Run build and targeted lint. The known unrelated ProductTable lint failure is outside this alignment task.

Results: production build passed (existing large-bundle advisory remains), targeted lint passed without warnings, admin browser suite passed, and the customer storefront regression suite passed. Read-only review found no functional regressions; the original console font stack was retained following review. No backend, environment, role-guard or API-contract changes were made.
