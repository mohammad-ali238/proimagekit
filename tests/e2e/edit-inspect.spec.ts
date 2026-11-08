import { expect, test } from "@playwright/test";
import { downloadFirst, fixture, isJpeg, isPng, resultDimensions, trackErrors, upload } from "./helpers";

const text = (bytes: Buffer) => bytes.toString("latin1");

test.describe("rotate & flip", () => {
  test("rotates a batch and shows a live preview", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/tools/image-rotator");
    await page.getByRole("button", { name: "Rotate right" }).click();
    await page.getByRole("button", { name: "Flip horizontal" }).click();
    await expect(page.getByText("Rotated 90°, flipped horizontally.")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles([fixture("photo.jpg"), fixture("transparent.png")]);

    await expect(page.getByAltText(/^Preview of /)).toBeVisible({ timeout: 30_000 });
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("photo.jpg");
    expect(isJpeg(bytes)).toBe(true);
    expect(await resultDimensions(page)).toBe("480 × 640");
    expect(errors).toEqual([]);
  });
});

test.describe("watermark", () => {
  test("adds a text watermark", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/tools/watermark-adder");
    await page.getByLabel("Watermark text").fill("© Test Studio");
    await page.getByRole("radio", { name: "Top left" }).click();
    await page.locator('input[type="file"]').first().setInputFiles(fixture("photo.jpg"));
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("photo-watermarked.jpg");
    expect(isJpeg(bytes)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("tiles a logo watermark", async ({ page }) => {
    await page.goto("/tools/watermark-adder");
    await page.getByRole("tab", { name: "Logo" }).click();
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Choose logo" }).click()]);
    await chooser.setFiles(fixture("logo.png"));
    await expect(page.getByText("logo.png")).toBeVisible();
    await page.getByRole("button", { name: "Tile" }).click();
    await page.locator('input[type="file"]').first().setInputFiles(fixture("transparent.png"));
    const { bytes } = await downloadFirst(page);
    expect(isPng(bytes)).toBe(true);
    await expect(page.getByText("No watermark set yet")).toHaveCount(0);
  });
});

test.describe("cropper", () => {
  test("crops to a square and downloads it", async ({ page }) => {
    const errors = trackErrors(page);
    await upload(page, "image-cropper", ["photo.jpg"]);
    await expect(page.getByTestId("crop-size")).toHaveText("640 × 480 px");
    await page.getByRole("radio", { name: "1:1" }).click();
    await expect(page.getByTestId("crop-size")).toHaveText("480 × 480 px");

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download cropped image" }).click()]);
    expect(download.suggestedFilename()).toBe("photo-cropped.jpg");
    expect(errors).toEqual([]);
  });

  test("opens HEIC photos", async ({ page }) => {
    await upload(page, "image-cropper", ["photo.heic"]);
    await expect(page.getByTestId("crop-size")).toHaveText("1200 × 900 px", { timeout: 30_000 });
  });

  test("uses EXIF orientation", async ({ page }) => {
    await upload(page, "image-cropper", ["rotated-gps.jpg"]);
    await expect(page.getByTestId("crop-size")).toHaveText("600 × 800 px");
  });
});

test.describe("colour picker", () => {
  test("picks a colour and shows its palette", async ({ page }) => {
    const errors = trackErrors(page);
    await upload(page, "image-color-picker", ["transparent.png"]);
    const image = page.getByAltText(/Click to pick a colour/);
    const box = (await image.boundingBox())!;
    // The centre of the fixture is the yellow circle.
    await image.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await expect(page.getByText("#FADC28").first()).toBeVisible();
    await expect(page.getByText("rgb(250, 220, 40)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Main colours" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Picked colours" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("metadata viewer", () => {
  test("shows GPS location and camera details", async ({ page }) => {
    const errors = trackErrors(page);
    await upload(page, "image-metadata-viewer", ["gps.jpg"]);
    await expect(page.getByText("This photo contains personal information")).toBeVisible();
    await expect(page.getByText("51.500000, -0.116667")).toBeVisible();
    await expect(page.getByRole("link", { name: /View on map/ })).toHaveAttribute("href", /openstreetmap\.org/);
    await expect(page.getByRole("cell", { name: "TestCam" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Jane Doe" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("reports clean images", async ({ page }) => {
    await upload(page, "image-metadata-viewer", ["photo.jpg"]);
    await expect(page.getByText("No location, camera or author details found")).toBeVisible();
  });
});

test.describe("EXIF remover", () => {
  for (const name of ["gps.jpg", "gps.png", "gps.webp"]) {
    test(`removes metadata from ${name} without re-encoding`, async ({ page }) => {
      const errors = trackErrors(page);
      await upload(page, "exif-remover", [name]);
      const { name: downloaded, bytes } = await downloadFirst(page);
      expect(downloaded).toBe(name);
      for (const secret of ["Jane Doe", "TestCam", "secret comment", "TRAILING"]) expect(text(bytes)).not.toContain(secret);
      await expect(page.getByText(/Removed: GPS location.*image data untouched/)).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("re-saves rotated JPGs upright", async ({ page }) => {
    await upload(page, "exif-remover", ["rotated-gps.jpg"]);
    const { bytes } = await downloadFirst(page);
    expect(text(bytes)).not.toContain("TestCam");
    await expect(page.getByText(/re-saved upright/)).toBeVisible();
    expect(await resultDimensions(page)).toBe("600 × 800");
  });

  test("saves HEIC as a clean JPG", async ({ page }) => {
    await upload(page, "exif-remover", ["photo.heic"]);
    const { name, bytes } = await downloadFirst(page);
    expect(name).toBe("photo.jpg");
    expect(isJpeg(bytes)).toBe(true);
  });
});
