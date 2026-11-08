import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { fixture, isJpeg, isPng, trackErrors } from "./helpers";

async function openPhoto(page: Page, name = "large-photo.jpg") {
  await page.goto("/editor");
  await page.locator('input[type="file"]').first().setInputFiles(fixture(name));
  await expect(page.getByRole("toolbar", { name: "Editor tools" })).toBeVisible({ timeout: 20_000 });
}

async function exportAs(page: Page, format: string): Promise<{ name: string; bytes: Buffer }> {
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: new RegExp(`^${format}`) }).click()]);
  return { name: download.suggestedFilename(), bytes: await readFile(await download.path()) };
}

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (bytes: Buffer) => `${bytes.readUInt32BE(16)} × ${bytes.readUInt32BE(20)}`;

const layers = (page: Page) => page.getByRole("list", { name: "Layers, front to back" }).getByRole("listitem");

test("opens a photo and exports it at full resolution", async ({ page }) => {
  const errors = trackErrors(page);
  await openPhoto(page);
  await expect(page.getByTestId("editor-size")).toHaveText("1600 × 1200 px");

  const { name, bytes } = await exportAs(page, "PNG");
  expect(name).toBe("large-photo-edited.png");
  expect(isPng(bytes)).toBe(true);
  // Exported at the document's size, not the zoomed-out screen size.
  expect(pngSize(bytes)).toBe("1600 × 1200");
  expect(errors).toEqual([]);
});

test("adds and edits text, with undo and redo", async ({ page }) => {
  await openPhoto(page);
  await page.getByRole("button", { name: "Add text" }).click();
  await page.waitForTimeout(500); // a pause, as a person would, so typing is its own undo step
  const textBox = page.getByLabel("Text content");
  await textBox.fill("Hello editor");
  await expect(layers(page).first()).toContainText("Hello editor");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(layers(page).first()).toContainText("Double-click to edit");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(layers(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(layers(page)).toHaveCount(2);

  const { bytes } = await exportAs(page, "JPG");
  expect(isJpeg(bytes)).toBe(true);
});

test("keyboard shortcuts add, delete, undo and duplicate", async ({ page }) => {
  await openPhoto(page);
  await page.getByTestId("editor-viewport").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("r");
  await expect(layers(page)).toHaveCount(2);
  await page.keyboard.press("Control+d");
  await expect(layers(page)).toHaveCount(3);
  await expect(layers(page).first()).toContainText("Rectangle copy");
  await page.keyboard.press("Delete");
  await expect(layers(page)).toHaveCount(2);
  await page.keyboard.press("Control+z");
  await expect(layers(page)).toHaveCount(3);
  await page.keyboard.press("Control+Shift+z");
  await expect(layers(page)).toHaveCount(2);
});

test("crops the canvas to a square and undoes it", async ({ page }) => {
  await openPhoto(page);
  await page.getByRole("button", { name: "Crop canvas" }).click();
  await page.getByRole("button", { name: "1:1" }).click();
  await expect(page.getByTestId("editor-crop-size")).toHaveText("1200 × 1200 px");
  await page.getByRole("button", { name: "Apply crop" }).click();
  await expect(page.getByTestId("editor-size")).toHaveText("1200 × 1200 px");

  const { bytes } = await exportAs(page, "PNG");
  expect(pngSize(bytes)).toBe("1200 × 1200");

  await page.keyboard.press("Control+z");
  await expect(page.getByTestId("editor-size")).toHaveText("1600 × 1200 px");
});

test("applies a black & white filter to the photo", async ({ page }) => {
  await openPhoto(page, "transparent.png");
  await layers(page).getByRole("button", { name: "Photo", exact: true }).click();
  await page.getByRole("switch", { name: "Black & white" }).click();

  const { bytes } = await exportAs(page, "PNG");

  // Check the exported pixels with the site's own colour picker.
  await page.goto("/tools/image-color-picker");
  await page.locator('input[type="file"]').setInputFiles({ name: "export.png", mimeType: "image/png", buffer: bytes });
  const image = page.getByAltText(/Click to pick a colour/);
  const box = (await image.boundingBox())!;
  await image.click({ position: { x: box.width / 2, y: box.height / 2 } }); // was yellow
  const rgb = await page.getByText(/^rgb\(/).innerText();
  const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
  expect(r).toBe(g);
  expect(g).toBe(b);
});

test("layers can be hidden and locked", async ({ page }) => {
  await openPhoto(page);
  await page.getByRole("button", { name: "Add ellipse" }).click();
  await page.getByRole("button", { name: "Hide Ellipse" }).click();
  await expect(page.getByRole("button", { name: "Show Ellipse" })).toBeVisible();
  await page.getByRole("button", { name: "Lock Ellipse" }).click();
  await expect(page.getByRole("button", { name: "Unlock Ellipse" })).toBeVisible();
});

test("starts from a blank canvas and exports WebP and AVIF", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/editor");
  await page.getByRole("button", { name: "Start with a blank canvas" }).click();
  await expect(page.getByTestId("editor-size")).toHaveText("1200 × 800 px");
  await page.getByRole("button", { name: "Add arrow" }).click();
  await page.getByRole("button", { name: "Add watermark" }).click();

  const webp = await exportAs(page, "WebP");
  expect(webp.name).toBe("untitled-edited.webp");
  expect(webp.bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  const avif = await exportAs(page, "AVIF");
  expect(avif.bytes.subarray(4, 12).toString("ascii")).toBe("ftypavif");
  expect(errors).toEqual([]);
});
