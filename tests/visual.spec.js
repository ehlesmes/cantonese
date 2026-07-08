import { test, expect } from "@playwright/test";
import path from "path";
import os from "os";

test("Curriculum Index Visual Render Test", async ({ page }) => {
  // Navigate to set context
  await page.goto("/cantonese");

  // Seed localStorage with Chapters 0 and 1 in review pool
  await page.evaluate(() => {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(["pronunciation-tones", "greetings"]),
    );
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
  await page.goto("/cantonese/chapter/greetings");

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

test("Phrasebook Visual Render Test", async ({ page }) => {
  // Mock Math.random to make card selections and token shuffling deterministic
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  });

  // Navigate to curriculum index first to set context
  await page.goto("/cantonese");

  // Seed localStorage with Chapter 1 checked
  await page.evaluate(() => {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(["greetings"]),
    );
  });

  // Navigate to Phrasebook
  await page.goto("/cantonese/phrasebook");
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

  // Save copy of screenshot to artifacts directory for visual inspection
  const artifactScreenshotPath = path.join(
    os.homedir(),
    ".gemini/antigravity/brain/8aac5a5b-96e0-4b82-a813-9b9820cfe4e2/phrasebook-session-screenshot.png",
  );
  await page.screenshot({ path: artifactScreenshotPath, fullPage: true });

  // Playwright visual assertion of the gameplay session
  await expect(page).toHaveScreenshot("review-session.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});

test("Vocabulary Visual Render Test", async ({ page }) => {
  // Mock Math.random to make card selections deterministic
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  });

  // Navigate to curriculum index first to set context
  await page.goto("/cantonese");

  // Seed localStorage with Chapter 1 checked
  await page.evaluate(() => {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(["greetings"]),
    );
  });

  // Navigate to Vocabulary
  await page.goto("/cantonese/vocabulary");
  await page.waitForSelector("#stats-cards-count");

  // Verify dashboard visual rendering
  await expect(page).toHaveScreenshot("vocabulary-dashboard.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });

  // Start the session
  const startBtn = page.locator("#start-session-btn");
  await startBtn.click();
  await page.waitForSelector("#flashcard-character-container");

  // Verify flashcard is loaded and revealed correctly after a click
  const charEl = page.locator("#flashcard-character-container .vocab-term");
  await expect(charEl).toBeVisible();

  // Save copy of screenshot to artifacts directory for visual inspection of vocab flashcard front
  const frontScreenshotPath = path.join(
    os.homedir(),
    ".gemini/antigravity/brain/8aac5a5b-96e0-4b82-a813-9b9820cfe4e2/vocabulary-session-front-screenshot.png",
  );
  await page.screenshot({ path: frontScreenshotPath, fullPage: true });

  // Assert flashcard front (only romanization on hover, translation hidden)
  await expect(page).toHaveScreenshot("vocabulary-session-front.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });

  // Click Reveal Answer
  const revealBtn = page.locator("#flashcard-reveal-btn");
  await revealBtn.click();
  await page.waitForSelector("#flashcard-answer-section");

  // Save copy of screenshot to artifacts directory for visual inspection of vocab flashcard back
  const backScreenshotPath = path.join(
    os.homedir(),
    ".gemini/antigravity/brain/8aac5a5b-96e0-4b82-a813-9b9820cfe4e2/vocabulary-session-back-screenshot.png",
  );
  await page.screenshot({ path: backScreenshotPath, fullPage: true });

  // Assert flashcard back (translation revealed)
  await expect(page).toHaveScreenshot("vocabulary-session-back.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
