import { expect, test } from "@playwright/test";
import { getToolHref, tools } from "../../src/lib/tools-registry";

test("homepage lists every tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const tool of tools) {
    await expect(page.locator(`main a[href="${getToolHref(tool)}"]`).first()).toBeVisible();
  }
});

for (const tool of tools) {
  test(`${tool.slug} page renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const response = await page.goto(getToolHref(tool));
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: tool.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown tool returns 404", async ({ page }) => {
  const response = await page.goto("/tools/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
