import { expect, test, type Page } from "@playwright/test";
import { downloadFirst, fixture } from "./helpers";

/** Moves the quality slider to an exact value with the keyboard (Home = minimum, then step up). */
async function setQuality(page: Page, value: number, min: number) {
  const slider = page.getByRole("slider", { name: "Quality" });
  await slider.focus();
  await page.keyboard.press("Home");
  for (let i = min; i < value; i++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue(String(value));
}

async function encodeAt(page: Page, path: string, file: string, value: number, min: number): Promise<Buffer> {
  await page.goto(path);
  await setQuality(page, value, min);
  await page.locator('input[type="file"]').setInputFiles(fixture(file));
  return (await downloadFirst(page)).bytes;
}

test.describe("quality above 80 is encoded at 80", () => {
  test("compressor", async ({ page }) => {
    const at80 = await encodeAt(page, "/tools/image-compressor", "large-photo.jpg", 80, 10);
    const at90 = await encodeAt(page, "/tools/image-compressor", "large-photo.jpg", 90, 10);
    const at100 = await encodeAt(page, "/tools/image-compressor", "large-photo.jpg", 100, 10);
    expect(at90.equals(at80)).toBe(true);
    expect(at100.equals(at80)).toBe(true);

    // Values at or below 80 are used as chosen.
    const at60 = await encodeAt(page, "/tools/image-compressor", "large-photo.jpg", 60, 10);
    expect(at60.length).toBeLessThan(at80.length);
  });

  test("converter", async ({ page }) => {
    const at80 = await encodeAt(page, "/tools/webp-to-jpg", "transparent.webp", 80, 60);
    const at100 = await encodeAt(page, "/tools/webp-to-jpg", "transparent.webp", 100, 60);
    expect(at100.equals(at80)).toBe(true);
    const at70 = await encodeAt(page, "/tools/webp-to-jpg", "transparent.webp", 70, 60);
    expect(at70.equals(at80)).toBe(false);
  });

  test("the slider still shows the value the user chose", async ({ page }) => {
    await page.goto("/tools/image-compressor");
    await setQuality(page, 95, 10);
    await expect(page.getByText("95", { exact: true })).toBeVisible();
  });
});
