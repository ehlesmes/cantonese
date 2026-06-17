/* global localStorage */
import { test, expect } from "@playwright/test";
import path from "path";
import os from "os";

test("Curriculum Index Visual Render Test", async ({ page }) => {
  // Navigate to set context
  await page.goto("/cantonese");

  // Seed localStorage with Chapters 0 and 1 in review pool
  await page.evaluate(() => {
    localStorage.setItem("cantonese_unlocked_chapters", JSON.stringify([0, 1]));
  });

  // Reload to apply local storage changes
  await page.goto("/cantonese");
  await page.waitForSelector("h1");

  // Playwright visual assertion against baseline image
  await expect(page).toHaveScreenshot("curriculum-index.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});

test("Chapter 1 Visual Render Test", async ({ page }) => {
  // Navigate to Chapter 1 URL
  await page.goto("/cantonese/chapter/01");

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

test("Review Board Visual Render Test", async ({ page }) => {
  // Navigate to curriculum index first to set context
  await page.goto("/cantonese");

  // Seed localStorage with Chapter 1 checked
  await page.evaluate(() => {
    localStorage.setItem("cantonese_unlocked_chapters", JSON.stringify([1]));
  });

  // Navigate to Review Board
  await page.goto("/cantonese/review");
  await page.waitForSelector("#stats-cards-count");

  // Verify dashboard visual rendering
  await expect(page).toHaveScreenshot("review-dashboard.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });

  // Start the session
  const startBtn = page.locator("#start-session-btn");
  await startBtn.click();
  await page.waitForSelector("#game-tokens-pool");

  // Click the first token chip to move it to the assembled area
  const firstChip = page.locator("#game-tokens-pool .token-chip").first();
  await expect(firstChip).toBeVisible();
  await firstChip.click();

  // Save copy of screenshot to artifacts directory for visual inspection of uniform vertical alignment
  const artifactScreenshotPath = path.join(
    os.homedir(),
    ".gemini/antigravity/brain/acc6c718-7d3e-415c-8f61-e3b0e467ee2d/review-session-screenshot.png",
  );
  await page.screenshot({ path: artifactScreenshotPath, fullPage: true });

  // Playwright visual assertion of the gameplay session
  await expect(page).toHaveScreenshot("review-session.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
