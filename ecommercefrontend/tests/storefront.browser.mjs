// Run against a local Vite server. See README.md for optional Playwright setup.
// All API traffic is intercepted: no real orders, accounts, or payments are changed.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright"
);
const baseURL = process.env.STOREFRONT_URL || "http://127.0.0.1:5173";
const output = join(tmpdir(), "villpo-storefront-qa");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
const errors = [];
const imageUrl = (id) => `https://fixture.test/component-${id}.svg`;
const categories = [
  "Development boards",
  "Sensors & modules",
  "Power & batteries",
  "Tools & prototyping",
  "Robotics",
  "Connectors",
].map((name, i) => ({
  categoryId: i + 1,
  categoryName: name,
  categoryImageUrl: imageUrl(i),
}));
const names = [
  "ESP32 Development Board WiFi + Bluetooth Dual Core",
  "Arduino Uno R3 ATmega328P Development Board",
  "HC-SR04 Ultrasonic Distance Sensor Module",
  "Raspberry Pi 5 8GB Single Board Computer",
  "Breadboard 830 Tie Points Solderless Prototyping Board",
  "SG90 Micro Servo Motor 9g",
  "LM2596 DC-DC Step Down Adjustable Power Supply Module",
  "DHT22 Digital Temperature and Humidity Sensor",
];
const products = names.map((name, i) => ({
  productId: i + 1,
  name,
  description:
    "A versatile component for your next electronics project. Check specifications before connecting your circuit.",
  price: [349, 549, 69, 7999, 89, 119, 49, 179][i],
  maxPrice: [449, 699, 99, 8499, 109, 159, 79, 249][i],
  stockQuantity: i === 6 ? 0 : 24,
  categoryId: (i % 6) + 1,
  categoryName: categories[i % 6].categoryName,
  thumbnailUrl: imageUrl(i),
  mediumImageUrl: imageUrl(i),
  largeImageUrl: imageUrl(i),
  gstPercentage: 18,
  widthCm: 5,
  heightCm: 3,
  weightKg: 0.02,
  images: [
    {
      uploadId: "image-" + i,
      processingStatus: "READY",
      largeUrl: imageUrl(i),
      mediumUrl: imageUrl(i),
      thumbnailUrl: imageUrl(i),
    },
    {
      uploadId: "second-" + i,
      processingStatus: "READY",
      largeUrl: imageUrl(i + 1),
      thumbnailUrl: imageUrl(i + 1),
    },
  ],
}));
let cart = {
  totalItems: 2,
  subtotalAmount: 698,
  shippingFee: 50,
  taxAmount: 125.64,
  totalAmount: 873.64,
  items: [
    {
      productId: 1,
      productName: names[0],
      thumbnailUrl: imageUrl(0),
      quantity: 2,
      unitPrice: 349,
      availableStock: 24,
      available: true,
    },
  ],
};
const order = {
  orderId: 1,
  orderNumber: "VIL-2026-001",
  status: "SHIPPED",
  paymentStatus: "PAID",
  currency: "INR",
  totalAmount: 873.64,
  subtotalAmount: 698,
  taxAmount: 125.64,
  shippingFee: 50,
  createdDt: "2026-11-03T09:00:00Z",
  customerFirstName: "Test",
  customerLastName: "Maker",
  items: [
    {
      orderItemId: 1,
      productId: 1,
      productName: names[0],
      unitPrice: 349,
      quantity: 2,
      lineTotal: 698,
    },
  ],
};
const calls = [];
let failCatalog = false;
let activeBanners = [];
let cartRequestStarted;
const cartStarted = new Promise((resolve) => {
  cartRequestStarted = resolve;
});
let slowQueryStarted;
let slowStarted = new Promise((resolve) => {
  slowQueryStarted = resolve;
});
const context = await browser.newContext();
await context.route("**/*", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.hostname === "fixture.test") {
    if (url.pathname.includes("component-7"))
      return route.fulfill({ status: 404, body: "" });
    const id = Number(url.pathname.match(/component-(\d+)/)?.[1] || 0);
    const width = id % 2 ? 400 : 240;
    const height = id % 2 ? 240 : 400;
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 240 320"><rect width="240" height="320" fill="white"/><rect x="45" y="40" width="150" height="230" rx="8" fill="${id % 2 ? "#196d8c" : "#296c46"}"/><rect x="78" y="100" width="82" height="90" rx="4" fill="#26332c"/><rect x="90" y="30" width="60" height="45" rx="3" fill="#b7bec0"/><g fill="#dab85e">${Array.from({ length: 12 }, (_, n) => `<rect x="50" y="${55 + n * 16}" width="10" height="7"/><rect x="180" y="${55 + n * 16}" width="10" height="7"/>`).join("")}</g><circle cx="170" cy="230" r="9" fill="#e7ecdf"/><text x="120" y="215" fill="white" text-anchor="middle" font-size="12" font-family="monospace">TEST BOARD</text></svg>`,
    });
  }
  if (
    !["xhr", "fetch"].includes(request.resourceType()) ||
    url.pathname.includes("/src/") ||
    url.pathname.includes("/@")
  )
    return route.continue();
  calls.push({
    path: url.pathname,
    query: url.search,
    method: request.method(),
  });
  let data = [];
  const path = url.pathname.replace(/^\/api/, "");
  if (
    /\/products\/category\/\d+\/active$/.test(path) ||
    path.endsWith("/products/active")
  ) {
    if (failCatalog)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Catalog temporarily unavailable" }),
      });
    const q = url.searchParams.get("q") || "";
    if (q === "slow") {
      slowQueryStarted();
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
    let list =
      q === "slow"
        ? [products[0]]
        : products.filter((product) =>
            product.name.toLowerCase().includes(q.toLowerCase()),
          );
    const categoryId = path.match(/category\/(\d+)/)?.[1];
    if (categoryId)
      list = list.filter(
        (product) => product.categoryId === Number(categoryId),
      );
    const page = Number(url.searchParams.get("page") || 0);
    data = {
      content: page ? list.slice(0, 2) : list,
      page,
      size: 20,
      totalElements: q || categoryId ? list.length : 28,
      totalPages: q || categoryId ? 1 : 2,
      first: page === 0,
      last: page === 1 || Boolean(q || categoryId),
    };
  } else if (/\/products\/\d+\/details$/.test(path)) {
    data = products.find(
      (product) =>
        product.productId === Number(path.match(/products\/(\d+)/)[1]),
    );
  } else if (path.endsWith("/categories/active/products")) {
    data = {
      content: categories.map((category) => ({
        ...category,
        products: products.filter(
          (product) => product.categoryId === category.categoryId,
        ),
      })),
    };
  } else if (path.endsWith("/categories")) data = categories;
  else if (path.endsWith("/main-banners/active")) data = null;
  else if (path.includes("/main-banners")) data = activeBanners;
  else if (path.includes("/home-sliders")) data = [];
  else if (path.endsWith("/cart/items") && request.method() === "POST") {
    cartRequestStarted();
    await new Promise((resolve) => setTimeout(resolve, 400));
    cart = { ...cart, totalItems: cart.totalItems + 1 };
    data = cart;
  } else if (path.startsWith("/cart")) data = cart;
  else if (path.endsWith("/orders/1/tracking"))
    data = [
      {
        status: "SHIPPED",
        note: "Handed to carrier",
        eventTime: "2026-11-04T10:00:00Z",
      },
    ];
  else if (path.endsWith("/orders/1")) data = order;
  else if (path.endsWith("/orders")) data = [order];
  else if (path.endsWith("/customers/me"))
    data = {
      firstName: "Test",
      lastName: "Maker",
      shippingAddress: {
        line1: "123 Circuit Road",
        city: "Chennai",
        country: "India",
      },
      billingAddress: {
        line1: "123 Circuit Road",
        city: "Chennai",
        country: "India",
      },
    };
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const waitProducts = () =>
  page.locator(".store-product-card").first().waitFor();
async function noOverflow(label) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
    offenders: [...document.querySelectorAll("main *")]
      .filter(
        (el) =>
          el.getBoundingClientRect().right > innerWidth + 1 &&
          getComputedStyle(el).position !== "absolute",
      )
      .slice(0, 4)
      .map((el) => el.className),
  }));
  assert.ok(
    widths.document <= widths.viewport + 1,
    label + " horizontal overflow " + JSON.stringify(widths),
  );
}
try {
  await page.goto(baseURL);
  await waitProducts();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow("home " + width);
    const cards = await page
      .locator(".store-product-card")
      .evaluateAll((els) =>
        els.slice(0, 2).map((el) => ({ x: el.offsetLeft, y: el.offsetTop })),
      );
    assert.equal(
      cards[0].y,
      cards[1].y,
      "At least two visible product columns",
    );
    assert.ok(
      await page
        .locator(".store-card-image img")
        .evaluateAll((els) =>
          els.every((el) => getComputedStyle(el).objectFit === "contain"),
        ),
    );
    await page.screenshot({
      path: join(output, `home-${width}.png`),
      fullPage: true,
    });
  }
  assert.equal(
    await page
      .locator(".store-product-card")
      .nth(6)
      .getByRole("button")
      .isDisabled(),
    true,
    "Out-of-stock purchase disabled",
  );
  await page
    .locator(".store-product-card")
    .nth(7)
    .getByRole("img", { name: /image unavailable/ })
    .waitFor();
  await page
    .locator(".store-product-card")
    .first()
    .getByRole("button", { name: "Add to cart" })
    .click();
  await page.waitForURL("**/login");
  assert.equal(
    calls.filter((call) => call.path.includes("/cart")).length,
    0,
    "Guest never requests cart",
  );
  await noOverflow("login");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("heading", { name: "Let’s start building." }).waitFor();
  activeBanners = [
    {
      mainBannerId: 1,
      headline: "Build a connected project",
      subheadline: "Development boards",
      badgeText: "New collection",
      description: "Explore our development boards.",
      imageUrl: imageUrl(0),
      primaryCtaLabel: "Explore boards",
      primaryCtaUrl: "/?category=1#products",
      secondaryCtaLabel: "Read returns policy",
      secondaryCtaUrl: "/legal/returns",
    },
    {
      mainBannerId: 2,
      headline: "Power your next circuit",
      primaryCtaLabel: "Browse power",
      primaryCtaUrl: "/?category=3#products",
    },
  ];
  await page.goto(baseURL);
  await page
    .getByRole("heading", { name: "Build a connected project" })
    .waitFor();
  await page.getByRole("button", { name: "Show promotion 2" }).click();
  await page
    .getByRole("heading", { name: "Power your next circuit" })
    .waitFor();
  await page.getByRole("button", { name: "Show promotion 1" }).click();
  await page
    .getByRole("button", { name: "Explore boards", exact: true })
    .click();
  await page.waitForURL("**/?category=1#products");
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Read returns policy" }).click();
  await page.waitForURL("**/legal/returns");
  activeBanners = [];
  await page.goto(baseURL);
  await waitProducts();
  await page
    .getByRole("button", { name: "Development boards", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll(".store-product-card").length === 2,
  );
  assert.ok(
    calls.some((call) => /category\/1\/active/.test(call.path)),
    "Category uses category API",
  );
  await page.getByRole("button", { name: /Clear filters/ }).click();
  await waitProducts();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("Page 2 of 2").waitFor();
  assert.ok(new URL(page.url()).searchParams.get("page") === "1");
  await page
    .getByRole("searchbox", { name: "Search components" })
    .fill("zzzzzz");
  await page.getByRole("heading", { name: "No components found" }).waitFor();
  assert.equal(
    new URL(page.url()).searchParams.has("page"),
    false,
    "Search resets page",
  );
  await page.getByRole("searchbox", { name: "Search components" }).fill("slow");
  await slowStarted;
  await page
    .getByRole("searchbox", { name: "Search components" })
    .fill("Arduino");
  await page.waitForFunction(() =>
    document
      .querySelector(".store-card-title")
      ?.textContent.includes("Arduino"),
  );
  await page.waitForTimeout(1000);
  assert.ok(
    (await page.locator(".store-card-title").first().textContent()).includes(
      "Arduino",
    ),
    "Old result cannot overwrite newer search",
  );
  failCatalog = true;
  await page
    .getByRole("searchbox", { name: "Search components" })
    .fill("failure");
  await page
    .getByRole("heading", { name: "We couldn’t load the catalog" })
    .waitFor();
  failCatalog = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("heading", { name: "No components found" }).waitFor();
  await page.goto(baseURL + "/products/1");
  await page.getByRole("heading", { level: 1, name: names[0] }).waitFor();
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  await page.waitForURL("**/login");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "test",
      type: "access",
      roles: ["USER"],
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: "maker@example.test",
    }),
  ).toString("base64url");
  await context.addInitScript(
    (token) => localStorage.setItem("accessToken", token),
    "test." + payload + ".test",
  );
  await page.goto(baseURL + "/products/1");
  await page.getByRole("heading", { level: 1, name: names[0] }).waitFor();
  await page.getByRole("button", { name: "View product image 2" }).click();
  assert.ok(
    (
      await page.locator(".store-gallery-image img").getAttribute("src")
    ).includes("component-1"),
  );
  await page.goto(baseURL);
  await waitProducts();
  await page
    .locator(".store-product-card")
    .first()
    .getByRole("button", { name: "Add to cart" })
    .click();
  await cartStarted;
  assert.equal(
    await page
      .locator(".store-product-card")
      .nth(1)
      .getByRole("button")
      .isDisabled(),
    true,
    "Cart requests cannot overlap across cards",
  );
  await page.getByRole("status").filter({ hasText: "Added to cart" }).waitFor();
  assert.ok(
    calls.some(
      (call) => call.path.endsWith("/cart/items") && call.method === "POST",
    ),
    "Signed-in public home cart works",
  );
  for (const route of [
    "/client",
    "/products/1",
    "/client/cart",
    "/client/orders",
    "/client/account",
    "/legal/privacy",
    "/legal/terms",
    "/legal/returns",
  ]) {
    await page.goto(baseURL + route);
    await page.locator("#main-content").waitFor();
    await page.waitForTimeout(400);
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow(route + " " + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: join(output, route.replaceAll("/", "-") + "-mobile.png"),
      fullPage: true,
    });
  }
  await page.goto(baseURL + "/client/cart");
  await page.getByRole("checkbox").first().waitFor();
  await page.getByRole("button", { name: "Unselect All" }).click();
  assert.equal(
    await page.getByRole("button", { name: /Checkout Selected/ }).isDisabled(),
    true,
  );
  await page.goto(baseURL + "/client/account");
  await page.getByRole("button", { name: "Update Profile" }).click();
  await noOverflow("account editing 390");
  await page.setViewportSize({ width: 900, height: 1000 });
  assert.equal(
    await page
      .locator(".store-desktop-actions")
      .getByRole("link", { name: "Orders", exact: true })
      .isVisible(),
    true,
  );
  assert.equal(
    await page
      .locator(".store-desktop-actions")
      .getByRole("link", { name: "Account", exact: true })
      .isVisible(),
    true,
  );
  assert.deepEqual(errors, [], "No uncaught browser exceptions");
  console.log(
    "PASS: responsive layouts (4 widths / 9 routes), image containment/fallback, stock state, public details and guest cart auth, category/search/pagination, request races, retry, gallery, banner API fields/controls/links, serialized cart UI and selection, account edit, tablet navigation labels.",
  );
  console.log("Test-only screenshots: " + output);
} finally {
  await browser.close();
}
