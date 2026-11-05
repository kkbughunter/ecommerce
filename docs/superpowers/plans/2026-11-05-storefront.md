# Electronics storefront implementation plan

**Goal:** Implement a cohesive, compact, product-first customer storefront.

**Architecture:** Keep existing React routes and backend contracts. Share storefront UI across public and authenticated entry points; scope styles to customer surfaces.

**Tech stack:** React 19, React Router 7, Tailwind 4, Vite 7.

**Spec:** ../specs/2026-11-05-storefront-design.md

## Constraints and review focus

Preserve staged backend changes, existing checkout/admin behavior, actual product images and commercial data. Check image failures, long names, narrow screens, guest cart routing, stale responses and category pagination.

## Tasks

- [x] Shared icons, image component, product cards, customer header/footer and scoped styles.
- [x] Unified storefront with real campaigns, categories, search, pagination and empty/loading states.
- [x] Product gallery and customer cart, account, orders, login and legal presentation.
- [x] Build and browser verification; record results and limitations.

Implementation is authorized by the user's request to start implementing the design. No hosting, publication, dependency migration, backend changes or payment execution is needed.

## Final decisions and verification

- Applied the user's subsequent blue, gray, silver, and white palette throughout customer pages. Product photography retains its actual colors.
- Public product details now match the backend's existing public GET policy. Admin editing and customer cart actions remain role-gated.
- Preserved banner headline, CTA fields, secondary actions and manual slide controls against the actual MainBannerResponse contract.
- Cart cards disable during mutation. Cart selection survives quantity updates; local quantity drafts reset to the server response.
- Added route scroll restoration so product navigation starts at the image and browser Back restores the prior position.
- `npm run build`: passed; Vite retains a bundle-size advisory (570 KB main chunk before gzip).
- ESLint on all changed JavaScript/JSX files: passed.
- Full `npm run lint`: blocked by the pre-existing set-state-in-effect error in admin ProductTable.jsx:58 and four existing admin warnings. Those files were not changed.
- Playwright checks passed at 360, 390, 768 and 1440 pixels across home, customer home, product, cart, orders, account and legal pages. Also checked auth forms, image containment/failure, out-of-stock actions, category/search/pagination, stale requests, error retry, banner contract/links, gallery selection, signed-in public cart, cart selection, account editing and accessible tablet navigation labels.
- Live backend smoke check: catalog loaded with one current product, no alerts or uncaught browser errors. Detailed browser tests use isolated fixtures; checkout/payment execution is untested.
- Existing staged backend changes and environment files were preserved.
