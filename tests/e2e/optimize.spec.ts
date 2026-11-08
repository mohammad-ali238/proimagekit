import { expect, test, type Page } from "@playwright/test";
import { downloadFirst, fixture, isJpeg, isPng, resultDimensions, trackErrors, upload } from "./helpers";

const LARGE_PHOTO_BYTES = 663_385;

async function chooseOption(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.describe("image compressor", () => {
  test("shrinks a high-quality JPG with MozJPEG", async ({ page }) => {
    const errors = trackErrors(page);
    await upload(page, "image-compressor", ["large-photo.jpg"]);
    const { name, bytes } = await downloadFirst(page);

    expect(name).toBe("large-photo.jpg");
    expect(isJpeg(bytes)).toBe(true);
    expect(bytes.length).toBeLessThan(LARGE_PHOTO_BYTES * 0.6);
    expect(await resultDimensions(page)).toBe("1600 × 1200");
    expect(errors).toEqual([]);
  });

  test("scales down to a maximum width", async ({ page }) => {
    await page.goto("/tools/image-compressor");
    await page.getByLabel("Maximum width in pixels").fill("800");
    await page.locator('input[type="file"]').setInputFiles(fixture("large-photo.jpg"));
    await downloadFirst(page);
    expect(await resultDimensions(page)).toBe("800 × 600");
  });

  test("optimises PNG losslessly with OxiPNG", async ({ page }) => {
    await upload(page, "image-compressor", ["transparent.png"]);
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("transparent.png");
    expect(isPng(bytes)).toBe(true);
    // OxiPNG may reduce RGBA to a palette, which keeps transparency in a tRNS chunk.
    const colourType = bytes[25];
    expect(colourType === 6 || colourType === 4 || (colourType === 3 && bytes.includes("tRNS"))).toBe(true);
  });

  test("converts to AVIF while compressing", async ({ page }) => {
    await page.goto("/tools/image-compressor");
    await chooseOption(page, "Output format", "AVIF");
    await page.locator('input[type="file"]').setInputFiles(fixture("large-photo.jpg"));
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("large-photo.avif");
    expect(bytes.subarray(4, 12).toString("ascii")).toBe("ftypavif");
  });

  test("keeps the original when compression would make it bigger", async ({ page }) => {
    await page.goto("/tools/image-compressor");
    const slider = page.getByRole("slider", { name: "Quality" });
    await slider.focus();
    await page.keyboard.press("End");
    await page.locator('input[type="file"]').setInputFiles(fixture("low-quality-gps.jpg"));
    await expect(page.getByText("Already optimised — original quality kept")).toBeVisible({ timeout: 30_000 });
  });

  test("preview shows a before/after comparison slider", async ({ page }) => {
    await upload(page, "image-compressor", ["large-photo.jpg"]);
    await page.getByRole("button", { name: /^Preview/ }).click({ timeout: 30_000 });
    const comparison = page.getByLabel("Comparison position");
    await expect(comparison).toBeVisible();
    await comparison.fill("20");
    await expect(page.getByRole("dialog").locator("img").nth(1)).toHaveAttribute("style", /inset\(0px 0px 0px 20%\)/);
  });
});

test.describe("image resizer", () => {
  test("resizes by width and keeps the aspect ratio", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/tools/image-resizer");
    await page.getByLabel("Width (px)").fill("320");
    await page.locator('input[type="file"]').setInputFiles(fixture("photo.jpg"));
    const { name, bytes } = await downloadFirst(page);

    expect(name).toBe("photo-320x240.jpg");
    expect(isJpeg(bytes)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("respects EXIF rotation", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await page.getByLabel("Width (px)").fill("300");
    await page.locator('input[type="file"]').setInputFiles(fixture("rotated-gps.jpg"));
    const { name } = await downloadFirst(page);
    expect(name).toBe("rotated-gps-300x400.jpg");
  });

  test("fills in the other side from the image when locked", async ({ page }) => {
    await upload(page, "image-resizer", ["photo.jpg"]);
    await downloadFirst(page);
    await page.getByLabel("Width (px)").fill("100");
    await expect(page.getByLabel("Height (px)")).toHaveValue("75");
  });

  test("applies a social media preset with centre crop", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await chooseOption(page, "Social media preset", "Post (square) · 1080 × 1080");
    await expect(page.getByRole("switch", { name: "Keep aspect ratio" })).not.toBeChecked();
    await page.locator('input[type="file"]').setInputFiles(fixture("large-photo.jpg"));
    await downloadFirst(page);
    expect(await resultDimensions(page)).toBe("1080 × 1080");
  });

  test("pads with the background colour for fit inside", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await page.getByRole("switch", { name: "Keep aspect ratio" }).click();
    await page.getByLabel("Width (px)").fill("500");
    await page.getByLabel("Height (px)").fill("500");
    await chooseOption(page, "If the shape doesn't match", "Fit inside");
    await chooseOption(page, "Output format", "PNG");
    await page.locator('input[type="file"]').setInputFiles(fixture("photo.jpg"));
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("photo-500x500.png");
    expect(isPng(bytes)).toBe(true);
  });

  test("resizes by percentage and warns when enlarging", async ({ page }) => {
    await page.goto("/tools/image-resizer");
    await page.getByRole("tab", { name: "By percentage" }).click();
    const slider = page.getByRole("slider", { name: "Scale percentage" });
    await slider.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.locator('input[type="file"]').setInputFiles(fixture("photo.jpg"));
    await downloadFirst(page);
    expect(await resultDimensions(page)).toBe("672 × 504");
    await expect(page.getByText("Enlarged — may look soft")).toBeVisible();
  });
});
