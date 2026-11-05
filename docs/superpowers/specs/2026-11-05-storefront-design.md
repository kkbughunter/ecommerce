# Electronics storefront redesign

The customer brief authorizes research, design decisions, and implementation across customer pages. Retain React, Vite, Tailwind, Villpo Store branding, and existing backend contracts. Work in the current checkout so the result is visible in the user's IDE; preserve staged backend work.

## Direction

A product-led component shop using the user's requested blue, gray, silver, and white palette: soft gray canvas, white image panels, dark blue typography, blue actions, and silver borders. Use a bounded 1328px content container (1264px inside desktop gutters), aligned cards, readable titles and INR prices, and two columns on narrow phones. Images use contain, appropriate source sizes, and graceful failure states. Avoid fabricated stock, reviews, shipping promises, discounts, and urgency.

## Approaches

Retheming the two separate homepages would preserve duplicated behavior. A framework replacement would unnecessarily disrupt existing APIs. Selected by the implementer: consolidate the public and signed-in storefront around shared navigation, product cards, footer, and catalog logic, then carry the same presentation through detail, cart, orders, account, authentication, and legal pages.

## Research

Reviewed https://robu.in/, https://quartzcomponents.com/, and https://electronicspices.com/ on 2026-11-05. Relevant patterns: prominent component search, category-led discovery, visible INR prices, stock and add-to-cart actions. Adapt these patterns without copying assets or making their commercial promises.

## Behavior and scope

Use real catalog/category/campaign endpoints. Preserve active banner and slider content, with manual controls. Search and category selection compose with pagination; prevent stale network responses overwriting newer results. Public browsing remains available without authentication. Customer cart actions require a valid customer session. Preserve payment, order tracking, account editing, admin product editing, and legal content.

## Verification

Production build, targeted behavior checks, and browser checks at 360px, 390px, 768px and desktop widths if browser tooling is available. Check long names, landscape/portrait/broken images, empty/error/loading states, guest access, filtering/pagination, disabled stock actions, and customer routes. Mocked API fixtures must remain test-only; payment execution is outside UI verification.
