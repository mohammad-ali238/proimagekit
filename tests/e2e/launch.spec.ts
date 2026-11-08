import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { getToolHref, tools } from "../../src/lib/tools-registry";
import { downloadFirst, fixture } from "./helpers";

const pages = ["/", "/compare", "/privacy", "/editor", ...tools.filter((tool) => !tool.href).map(getToolHref)];

test.describe("accessibility", () => {
  for (const path of pages) {
    test(`${path} has no serious accessibility issues`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
      expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("dark mode has no serious contrast issues", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(results.violations.filter((violation) => violation.impact === "serious")).toEqual([]);
  });
});

test.describe("SEO files", () => {
  test("sitemap lists every tool", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const tool of tools) expect(sitemap).toContain(`${getToolHref(tool)}</loc>`);
    expect(sitemap).toContain("/compare</loc>");
  });

  test("robots.txt points to the sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("Disallow: /serwist/");
  });

  test("every tool has an Open Graph image", async ({ page, request }) => {
    await page.goto("/tools/image-compressor");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    const response = await request.get(new URL(ogImage!).pathname);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect((await response.body()).subarray(1, 4).toString()).toBe("PNG");
  });

  test("manifest describes an installable app", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  });
});

test("tools keep working offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.state;
  });
  // Wait until the precache is filled (all pages are part of it).
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).some((key) => key.includes("precache"))), { timeout: 30_000 })
    .toBe(true);
  await page.reload(); // let the worker control the page

  await context.setOffline(true);
  await page.goto("/tools/png-to-jpg"); // never visited, served from the precache
  await expect(page.getByRole("heading", { level: 1, name: "PNG to JPG Converter" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(fixture("transparent.png"));
  const { name } = await downloadFirst(page);
  expect(name).toBe("transparent.jpg");
  await context.setOffline(false);
});

test("the compressor (WebAssembly worker) works offline after one online use", async ({ page, context }) => {
  await page.goto("/tools/image-compressor");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the worker control the page
  await page.locator('input[type="file"]').setInputFiles(fixture("large-photo.jpg"));
  await downloadFirst(page); // loads and caches the codec worker and MozJPEG

  // Empty the HTTP cache so offline loads really come from the service worker's caches.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.clearBrowserCache");
  await context.setOffline(true);
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles(fixture("large-photo.jpg"));
  const { name, bytes } = await downloadFirst(page);
  expect(name).toBe("large-photo.jpg");
  expect(bytes.length).toBeLessThan(400_000);
  await context.setOffline(false);
});

test("the Pro dialog appears when the free batch limit is exceeded", async ({ page }) => {
  await page.goto("/tools/image-compressor");
  const photo = await readFile(fixture("photo.jpg"));
  const files = Array.from({ length: 21 }, (_, index) => ({ name: `photo-${index + 1}.jpg`, mimeType: "image/jpeg", buffer: photo }));
  await page.locator('input[type="file"]').setInputFiles(files);

  const dialog = page.getByRole("dialog", { name: /Pro is coming soon/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("up to 20 images");
  await dialog.getByRole("button", { name: "Keep using the free version" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /^Remove photo-/ })).toHaveCount(20);
});

test("compare and privacy pages", async ({ page }) => {
  await page.goto("/compare");
  for (const tool of tools) await expect(page.getByRole("link", { name: tool.name, exact: true }).first()).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Your images never leave your device" })).toBeVisible();
});

test("the compressor never returns metadata, even when it keeps the original", async ({ page }) => {
  await page.goto("/tools/image-compressor");
  const slider = page.getByRole("slider", { name: "Quality" });
  await slider.focus();
  await page.keyboard.press("End");
  await page.locator('input[type="file"]').setInputFiles(fixture("low-quality-gps.jpg"));
  await expect(page.getByText("Already optimised — original quality kept")).toBeVisible({ timeout: 30_000 });
  const { bytes } = await downloadFirst(page);
  const text = bytes.toString("latin1");
  expect(text).not.toContain("TestCam");
  expect(text).not.toContain("Jane Doe");
});
