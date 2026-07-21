import { test, expect } from "./coverage-fixture.js";
import path from "path";
import type { Page } from "@playwright/test";

async function assertScreenshot(page: Page, name: string) {
  if (process.env.COVERAGE === "true") {
    return;
  }
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
}

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
  await expect(page.locator("h1").first()).toBeVisible();

  // Playwright visual assertion against baseline image
  await assertScreenshot(page, "curriculum-index.png");
});

test("Chapter 1 Visual Render Test", async ({ page }) => {
  // Navigate to Chapter 1 URL
  await page.goto("/cantonese/chapter/greetings");

  // Ensure content is loaded
  await expect(page.locator("h1").first()).toBeVisible();

  // Save a copy of the screenshot directly to the test-results folder for visual inspection
  const artifactScreenshotPath = path.resolve(
    "test-results",
    "chapter1-screenshot.png",
  );
  await page.screenshot({ path: artifactScreenshotPath, fullPage: true });

  // Playwright visual assertion against baseline image
  await assertScreenshot(page, "chapter-page.png");
});

test("Practice Visual Render Test", async ({ page }) => {
  // Mock Math.random to make card selections and token shuffling deterministic
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      const x = Math.sin(seed++) * 10000;
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

  // Navigate to Practice
  await page.goto("/cantonese/practice");
  await expect(page.locator("#stats-cards-count")).toBeVisible();

  // Verify dashboard visual rendering
  await assertScreenshot(page, "practice-dashboard.png");

  // Start the session
  const startBtn = page.locator("#start-session-btn");
  await startBtn.click();

  // Wait for session view
  await expect(page.locator("#session-view")).toBeVisible();

  // Save copy of screenshot to test-results folder for visual inspection
  const artifactScreenshotPath = path.resolve(
    "test-results",
    "practice-session-screenshot.png",
  );
  await page.screenshot({ path: artifactScreenshotPath, fullPage: true });

  // Playwright visual assertion of the gameplay session
  await assertScreenshot(page, "practice-session.png");
});

test("SyncModal Visual Render Test", async ({ page }) => {
  await page.goto("/cantonese");
  await expect(page.locator("#sync-trigger-btn")).toBeVisible();

  // Click the sync button to open the modal
  await page.click("#sync-trigger-btn");

  // Wait for the modal to be visible
  await expect(page.locator("#sync-modal-overlay")).toBeVisible();

  // Visual assertion
  await assertScreenshot(page, "sync-modal-open.png");
});

export {};
