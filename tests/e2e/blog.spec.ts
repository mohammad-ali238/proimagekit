import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SLUG = "how-to-add-watermark-on-image";
const URL_PATH = `/blog/${SLUG}`;

test("renders an article with its content, components and metadata", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(URL_PATH);
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: /How to Add a Watermark/ })).toBeVisible();
  await expect(page).toHaveTitle("How to Add a Watermark to a Photo — Free & Private | ProImageKit");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${URL_PATH}$`));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute("content", /^2026-09-29/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /cover\.jpg$/);

  // Markdown features: headings with anchors, a table, callouts, a tool card and internal links.
  await expect(page.locator("h2#step-1-open-the-watermark-tool")).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(/Your photos never leave your device/)).toBeVisible();
  const article = page.getByRole("article");
  await expect(article.getByRole("link", { name: /Watermark/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Try it yourself" })).toBeVisible();

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const posting = jsonLd.map((text) => JSON.parse(text)).find((data) => data["@type"] === "BlogPosting");
  expect(posting.headline).toMatch(/How to Add a Watermark/);
  expect(posting.dateModified).toMatch(/^2026-09-29/);
  expect(errors).toEqual([]);
});

test("the article has no serious accessibility issues", async ({ page }) => {
  await page.goto(URL_PATH);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});

for (const path of ["/", "/tools/image-compressor", "/privacy"]) {
  test(`${path} lists the latest articles above the footer`, async ({ page }) => {
    await page.goto(path);
    const section = page.getByRole("region", { name: "Latest articles" });
    await expect(section).toBeVisible();
    await expect(section.getByRole("link", { name: /How to Add a Watermark/ })).toHaveAttribute("href", URL_PATH);
    // The section comes right before the footer.
    const followedByFooter = await section.evaluate((element) => element.nextElementSibling?.tagName === "FOOTER");
    expect(followedByFooter).toBe(true);
  });
}

test("articles are in the sitemap with their update date", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(new RegExp(`${URL_PATH}</loc>\\s*<lastmod>2026-09-29`));
});

test("unknown articles return 404", async ({ page }) => {
  const response = await page.goto("/blog/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("templates are not published", async ({ page }) => {
  const response = await page.goto("/blog/_template");
  expect(response?.status()).toBe(404);
});

test("articles without a cover get a generated social image", async ({ request }) => {
  const response = await request.get(`/og/blog/${SLUG}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});
