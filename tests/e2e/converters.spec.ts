import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { downloadFirst, fixture, hasMetadata, isJpeg, isPng, trackErrors, upload } from "./helpers";

test("HEIC to JPG converts an iPhone photo and strips metadata", async ({ page }) => {
  const errors = trackErrors(page);
  await upload(page, "heic-to-jpg", ["photo.heic"]);
  const { name, bytes } = await downloadFirst(page);

  expect(name).toBe("photo.jpg");
  expect(isJpeg(bytes)).toBe(true);
  await expect(page.getByText("1200 × 900")).toBeVisible();
  expect(errors).toEqual([]);
});

test("JPG to PNG applies EXIF rotation and removes GPS data", async ({ page }) => {
  const errors = trackErrors(page);
  await upload(page, "jpg-to-png", ["rotated-gps.jpg"]);
  const { name, bytes } = await downloadFirst(page);

  expect(name).toBe("rotated-gps.png");
  expect(isPng(bytes)).toBe(true);
  // Stored as 800×600 with "rotate 90°" in EXIF, so the output must be upright.
  await expect(page.getByText("600 × 800")).toBeVisible();
  expect(hasMetadata(bytes)).toBe(false);
  expect(errors).toEqual([]);
});

test("WebP to PNG keeps transparency", async ({ page }) => {
  await upload(page, "webp-to-png", ["transparent.webp"]);
  const { bytes } = await downloadFirst(page);

  expect(isPng(bytes)).toBe(true);
  // PNG IHDR colour type 6 = RGBA.
  expect(bytes[25]).toBe(6);
});

test("WebP to JPG shows quality and background options", async ({ page }) => {
  await upload(page, "webp-to-jpg", ["transparent.webp"]);
  await expect(page.getByRole("slider", { name: "Quality" })).toBeVisible();
  await expect(page.getByLabel("Background for transparent areas")).toBeVisible();
  const { bytes } = await downloadFirst(page);
  expect(isJpeg(bytes)).toBe(true);
});

test("format converter encodes AVIF with the WebAssembly worker", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/tools/image-format-converter");
  await page.getByLabel("Convert to").click();
  await page.getByRole("option", { name: "AVIF" }).click();
  await page.locator('input[type="file"]').setInputFiles(fixture("photo.jpg"));

  const { name, bytes } = await downloadFirst(page);
  expect(name).toBe("photo.avif");
  expect(bytes.subarray(4, 12).toString("ascii")).toBe("ftypavif");
  expect(errors).toEqual([]);
});

test("changing the output format re-converts existing files", async ({ page }) => {
  await upload(page, "image-format-converter", ["photo.jpg"]);
  await expect(page.getByRole("button", { name: "Download photo.webp" })).toBeVisible({ timeout: 30_000 });

  await page.getByLabel("Convert to").click();
  await page.getByRole("option", { name: "PNG" }).click();
  await expect(page.getByRole("button", { name: "Download photo.png" })).toBeVisible({ timeout: 30_000 });
});

test("batch conversion downloads a ZIP", async ({ page }) => {
  await upload(page, "png-to-jpg", ["transparent.png", "transparent.png"]);
  const zipButton = page.getByRole("button", { name: "Download all (ZIP)" });
  await expect(zipButton).toBeVisible({ timeout: 30_000 });

  const [download] = await Promise.all([page.waitForEvent("download"), zipButton.click()]);
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 2).toString("ascii")).toBe("PK");
  // Duplicate names are numbered inside the ZIP.
  expect(bytes.includes("transparent.jpg")).toBe(true);
  expect(bytes.includes("transparent (2).jpg")).toBe(true);
});

test("rejects files that aren't the right format", async ({ page }) => {
  await upload(page, "heic-to-jpg", ["not-an-image.txt"]);
  await expect(page.getByText(/isn't a supported file/)).toBeVisible();
});
