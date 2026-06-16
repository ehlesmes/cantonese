import { test, expect } from "@playwright/test";
import path from "path";
import os from "os";

test("Chapter 1 Visual Render Test", async ({ page }) => {
  // Navigate to the course reader dev URL
  await page.goto("/cantonese");

  // Ensure content is loaded
  await page.waitForSelector("h1");

  // Save a copy of the screenshot directly to the artifact folder for visual inspection
  const artifactScreenshotPath = path.join(
    os.homedir(),
    ".gemini/antigravity/brain/acc6c718-7d3e-415c-8f61-e3b0e467ee2d/chapter1-screenshot.png",
  );
  await page.screenshot({ path: artifactScreenshotPath, fullPage: true });

  // Playwright visual assertion against baseline image
  await expect(page).toHaveScreenshot("chapter-page.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
