import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
const baseURL = process.env.STOREFRONT_URL || "http://127.0.0.1:5173";
const output = join(tmpdir(), "villpo-admin-qa");
await mkdir(output, { recursive: true });
const errors = [];
let failSave = false;
const category = {
  categoryId: 1,
  categoryName: "Development boards and electronic components",
};
const product = {
  productId: 1,
  name: "ESP32 Development Board WiFi + Bluetooth Dual Core",
  price: 349,
  maxPrice: 449,
  stockQuantity: 24,
  categoryName: category.categoryName,
  isActive: true,
};
const banner = {
  mainBannerId: 1,
  headline: "Build your next connected project",
  imageUrl: "",
  primaryCtaUrl: "/",
  isActive: true,
  displayOrder: 0,
};
const slider = {
  homeSliderId: 1,
  title: "Explore development boards",
  subtitle: "Featured parts",
  targetUrl: "/",
  placementTag: "LIMITED_OFFER",
  displayOrder: 0,
  isActive: true,
};
const customer = {
  customerId: 1,
  firstName: "Test",
  lastName: "Maker",
  email: "long.customer.address@example.test",
  isActive: true,
  billingAddress: {},
  shippingAddress: {},
};
const order = {
  orderId: 1,
  orderNumber: "VIL-2026-001",
  status: "PLACED",
  paymentStatus: "PAID",
  customerFirstName: "Test",
  customerEmail: customer.email,
  totalAmount: 349,
  createdDt: new Date().toISOString(),
  items: [],
  shippingAddress: {},
  billingAddress: {},
};
const paginate = (content) => ({
  content,
  page: 0,
  size: 20,
  first: true,
  last: true,
  totalPages: 1,
  totalElements: content.length,
});
async function newPage(role) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const payload = Buffer.from(
    JSON.stringify({
      sub: "test",
      type: "access",
      roles: [role],
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: "admin@example.test",
    }),
  ).toString("base64url");
  await context.addInitScript(
    (token) => localStorage.setItem("accessToken", token),
    "test." + payload + ".test",
  );
  await context.route("**/*", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api/, "");
    if (
      !["xhr", "fetch"].includes(req.resourceType()) ||
      path.startsWith("/src/") ||
      path.startsWith("/@")
    )
      return route.continue();
    let data = {};
    if (req.method() !== "GET") {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return route.fulfill({
        status: failSave ? 400 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          failSave
            ? { message: "Test validation failure" }
            : { data: { ...category, ...req.postDataJSON() } },
        ),
      });
    }
    if (path === "/categories") data = [category];
    else if (path === "/products") data = paginate([product]);
    else if (path === "/admin/main-banners") data = [banner];
    else if (path === "/admin/home-sliders") data = [slider];
    else if (path === "/customers") data = [customer];
    else if (path === "/customers/1") data = customer;
    else if (path === "/admin/orders") data = paginate([order]);
    else if (path === "/orders/1") data = order;
    else if (path.endsWith("/tracking")) data = [];
    else if (path.includes("/payments/orders")) data = { attempts: [] };
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
}
async function aligned(page, label) {
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    metrics.scroll <= metrics.width + 1,
    label + " overflow " + JSON.stringify(metrics),
  );
}
async function drawerCheck(page, label) {
  const panel = page.getByRole("dialog");
  await panel.waitFor();
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
    "Background scroll locked",
  );
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await aligned(page, label + " drawer " + width);
    const rect = await panel.boundingBox();
    assert.ok(
      rect.x >= -1 && rect.x + rect.width <= width + 1,
      label + " " + width + " " + JSON.stringify(rect),
    );
    assert.ok(rect.height <= 901);
    assert.ok(
      await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      "No drawer horizontal overflow",
    );
  }
  for (let i = 0; i < 35; i++) await page.keyboard.press("Tab");
  assert.ok(
    await panel.evaluate((el) => el.contains(document.activeElement)),
    "Focus stays inside modal",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.locator(".admin-drawer-body").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  assert.equal(
    await panel
      .getByRole("button", { name: "Close panel", exact: true })
      .isVisible(),
    true,
  );
  await page.screenshot({
    path: join(output, label + "-drawer-mobile.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  assert.notEqual(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
}
try {
  const admin = await newPage("ADMIN");
  for (const route of [
    "/admin",
    "/admin/products",
    "/admin/orders",
    "/admin/payments",
    "/admin/invoices",
  ]) {
    await admin.goto(baseURL + route);
    await admin.locator(".admin-content").waitFor();
    await admin.waitForTimeout(200);
    for (const width of [360, 768, 1024, 1440]) {
      await admin.setViewportSize({ width, height: 900 });
      await aligned(admin, route + " " + width);
    }
  }
  await admin.goto(baseURL + "/admin/products");
  const add = admin.getByRole("button", { name: "+ New Product", exact: true });
  await add.click();
  await admin
    .getByRole("dialog")
    .getByRole("textbox", { name: "Product Name", exact: true })
    .fill("Draft component");
  await drawerCheck(admin, "product");
  assert.ok(
    await add.evaluate((el) => el === document.activeElement),
    "Focus restored to trigger",
  );
  await add.click();
  assert.equal(
    await admin
      .getByRole("dialog")
      .getByRole("textbox", { name: "Product Name", exact: true })
      .inputValue(),
    "Draft component",
    "Closing preserves product draft",
  );
  await admin.getByRole("button", { name: "Close panel", exact: true }).click();
  await admin.goto(baseURL + "/admin/products/new");
  await admin.getByRole("dialog").waitFor();
  await admin.getByRole("button", { name: "Close panel", exact: true }).click();
  await admin.waitForURL("**/admin/products");
  for (const route of ["/admin/orders", "/admin/payments", "/admin/invoices"]) {
    await admin.goto(baseURL + route);
    await admin.locator("tbody tr").first().waitFor();
    await admin.locator("tbody tr").first().click();
    await drawerCheck(admin, route.split("/").pop());
  }
  const superadmin = await newPage("SUPER_ADMIN");
  for (const [route, button] of [
    ["/superadmin/categories", "+ New Category"],
    ["/superadmin/sliders", "+ New Slider"],
    ["/superadmin/main-banners", "+ New Main Banner"],
    ["/superadmin/customers", null],
  ]) {
    await superadmin.goto(baseURL + route);
    await superadmin.locator(".admin-content").waitFor();
    await superadmin.waitForTimeout(200);
    for (const width of [360, 768, 1024, 1440]) {
      await superadmin.setViewportSize({ width, height: 900 });
      await aligned(superadmin, route + " " + width);
    }
    await superadmin.screenshot({
      path: join(output, route.split("/").pop() + "-desktop.png"),
      fullPage: true,
    });
    if (button)
      await superadmin
        .getByRole("button", { name: button, exact: true })
        .click();
    else
      await superadmin.locator(".admin-customer-list button").first().click();
    await drawerCheck(superadmin, route.split("/").pop());
    if (route.includes("sliders") || route.includes("main-banners")) {
      await superadmin
        .getByRole("button", { name: "Edit", exact: true })
        .first()
        .click();
      assert.ok(
        await superadmin
          .getByRole("dialog")
          .locator("input")
          .first()
          .inputValue(),
        "Edit preserves record values",
      );
      await superadmin
        .getByRole("button", { name: "Close panel", exact: true })
        .click();
    }
  }
  await superadmin.goto(baseURL + "/superadmin/categories");
  await superadmin
    .getByRole("button", { name: "+ New Category", exact: true })
    .click();
  await superadmin
    .getByRole("textbox", { name: "Category Name", exact: true })
    .fill("Sensors");
  failSave = true;
  await superadmin
    .getByRole("button", { name: "Create Category", exact: true })
    .click();
  await superadmin.keyboard.press("Escape");
  assert.ok(
    await superadmin.getByRole("dialog").isVisible(),
    "Cannot dismiss pending save",
  );
  await superadmin.getByRole("dialog").getByRole("alert").waitFor();
  assert.equal(
    await superadmin
      .getByRole("textbox", { name: "Category Name", exact: true })
      .inputValue(),
    "Sensors",
    "Failure preserves input",
  );
  failSave = false;
  await superadmin
    .getByRole("button", { name: "Create Category", exact: true })
    .click();
  await superadmin.getByRole("dialog").waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 9 admin/super-admin pages at 4 widths; 8 drawer flows; focus trap/restoration, Escape, scroll locking, draft preservation, edit prefill, direct product URL, pending save and error/retry.",
  );
  console.log("Screenshots: " + output);
} finally {
  await browser.close();
}
