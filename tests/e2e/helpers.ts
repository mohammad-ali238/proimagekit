import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const fixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

/** Collects page errors and console errors (including CSP violations). */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

export async function upload(page: Page, slug: string, files: string[]) {
  await page.goto(`/tools/${slug}`);
  await page.locator('input[type="file"]').setInputFiles(files.map(fixture));
}

export async function downloadFirst(page: Page): Promise<{ name: string; bytes: Buffer }> {
  // Per-file buttons are named "Download <file>"; skip "Download all (ZIP)".
  const button = page.getByRole("button", { name: /^Download (?!all \(ZIP\)).+/ }).first();
  await expect(button).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  return { name: download.suggestedFilename(), bytes: await readFile(await download.path()) };
}

export const isJpeg = (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8;
export const isPng = (bytes: Buffer) => bytes.subarray(1, 4).toString("ascii") === "PNG";
export const hasMetadata = (bytes: Buffer) => bytes.includes("Exif") || bytes.includes("TestCam");

/** Reads "W × H" from the first finished result row. */
export async function resultDimensions(page: Page): Promise<string> {
  const text = await page.locator("li").filter({ has: page.getByRole("button", { name: /^Download (?!all \(ZIP\))/ }) }).first().innerText();
  return text.match(/\d+ × \d+/)?.[0] ?? "";
}
