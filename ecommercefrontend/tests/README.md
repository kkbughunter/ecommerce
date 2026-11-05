# Storefront browser checks

`storefront.browser.mjs` checks responsive layouts, product image containment and broken-image fallbacks, guest browsing/auth redirects, out-of-stock actions, search races, category pagination, API failures, banner contracts, image galleries, cart interactions, and account editing.

All API requests and image fixtures are intercepted in the browser. The script does not place real orders or modify the backend.

1. Start the frontend with `npm run dev -- --host 127.0.0.1`.
2. Make Playwright available locally with `npm install --no-save --package-lock=false playwright`, or set `PLAYWRIGHT_MODULE` to an existing Playwright `index.mjs` file. This is optional verification tooling, not an application dependency.
3. Run `node tests/storefront.browser.mjs` in the frontend directory.

The default browser is installed Microsoft Edge. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. `STOREFRONT_URL` overrides the default `http://127.0.0.1:5173`.

Screenshots use test-only catalog data and are saved to `villpo-storefront-qa` in the OS temporary directory. Production catalog data is never replaced by these fixtures.

## Admin and super-admin drawers

Run `node tests/admin.browser.mjs` with the same setup to check nine console pages at four viewport widths, eight drawer workflows, keyboard focus, background scroll locking, edit values, product drafts, direct URLs, and pending/failed category saves. Requests are mocked; no real catalog or customer records are modified. Screenshots are written to `villpo-admin-qa` in the OS temporary directory.
