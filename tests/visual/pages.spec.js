import { test, expect } from "@playwright/test";

test.describe("Page Component Visual Tests", () => {
  test("Reading Page - Initial State", async ({ page }) => {
    await page.goto("/reading.html");
    await page.waitForSelector(".page-container");
    await expect(page).toHaveScreenshot("reading-page-initial.png");
  });

  test("Reading Page - Revealed State", async ({ page }) => {
    await page.goto("/reading.html");
    await page.waitForSelector(".page-container");
    await page.click("#primary-btn");
    const translation = page.locator(".translation-text");
    await expect(translation).toBeVisible();
    await expect(page).toHaveScreenshot("reading-page-revealed.png");
  });

  test("Unscramble Page - Initial State", async ({ page }) => {
    await page.goto("/unscramble.html");
    await page.waitForSelector(".page-container");
    await expect(page).toHaveScreenshot("unscramble-page-initial.png");
  });

  test("Unscramble Page - Completed State", async ({ page }) => {
    await page.goto("/unscramble.html");
    await page.waitForSelector(".page-container");

    // We need to click tokens to complete it.
    // In unscramble.html the tokens are: 我 (ngo5), 係 (hai6), 學生 (hok6 saang1)
    // The pool contains them.
    const tokens = page.locator(".token-text");
    const count = await tokens.count();

    // Click them all to move to slots
    for (let i = 0; i < count; i++) {
      // Just click the first available one in the pool until pool is empty
      await page.locator("#pool .token").first().click();
    }

    // Check if the primary button is enabled
    await expect(page.locator("#primary-btn")).not.toBeDisabled();

    await expect(page).toHaveScreenshot("unscramble-page-completed.png");
  });

  test("Explanation Page", async ({ page }) => {
    await page.goto("/explanation.html");
    await page.waitForSelector(".page-container");
    await expect(page).toHaveScreenshot("explanation-page.png");
  });

  test("Congratulations Page - With Next Lesson", async ({ page }) => {
    await page.goto("/congratulations.html");
    // Initial render is with next lesson
    await page.waitForSelector(".page-container");
    await expect(page).toHaveScreenshot("congratulations-with-next.png");
  });

  test("Congratulations Page - Without Next Lesson", async ({ page }) => {
    await page.goto("/congratulations.html");
    await page.waitForSelector(".page-container");
    await page.click("text=Without Next Lesson");
    // Wait a bit for re-render
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot("congratulations-without-next.png");
  });

  test("Demo Lesson - Full View", async ({ page }) => {
    await page.goto("/demo_lesson.html");
    // Wait for content to load
    await page.waitForSelector(".page-container");
    await expect(page).toHaveScreenshot("demo-lesson-initial.png");
  });
});
