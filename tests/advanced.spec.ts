import { test, expect } from "./coverage-fixture.js";

test.describe("Advanced Page Reset E2E Test", () => {
  test.beforeEach(async ({ page }) => {
    // Seed some progress before navigation using addInitScript
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["pronunciation-tones", "greetings"]),
      );
      window.localStorage.setItem(
        "cantonese_srs_state",
        JSON.stringify({ card1: { level: 2 } }),
      );
    });
  });

  test("should allow resetting all progress via advanced settings confirm modal", async ({
    page,
  }) => {
    // Navigate to advanced settings page
    await page.goto("/cantonese/advanced");
    await page.waitForSelector("#clear-all-btn");

    // Click clear progress button
    await page.locator("#clear-all-btn").click();

    // Verify confirmation modal is displayed (has class "show")
    const confirmModal = page.locator("#confirm-modal");
    await expect(confirmModal).toHaveClass(/show/);

    // Click confirm reset
    await page.locator("#modal-confirm-btn").click();

    // The page should reload and reset localStorage progress values
    await page.waitForURL(/\/cantonese\/advanced/);

    const keys = await page.evaluate(() => {
      return {
        chapters: localStorage.getItem("cantonese_unlocked_chapters"),
        srs: localStorage.getItem("cantonese_srs_state"),
      };
    });

    // Verify keys are cleared (unlocked chapters is removed from storage)
    expect(keys.chapters).toBeNull();
    expect(keys.srs).toBeNull();
  });

  test("should allow canceling progress reset dialog", async ({ page }) => {
    await page.goto("/cantonese/advanced");
    await page.waitForSelector("#clear-all-btn");

    // Click clear progress button
    await page.locator("#clear-all-btn").click();

    // Click cancel
    await page.locator("#modal-cancel-btn").click();

    // Modal should be hidden (does not have class "show")
    const confirmModal = page.locator("#confirm-modal");
    await expect(confirmModal).not.toHaveClass(/show/);

    // Verify localStorage progress values are still intact
    const keys = await page.evaluate(() => {
      return {
        chapters: localStorage.getItem("cantonese_unlocked_chapters"),
      };
    });
    expect(keys.chapters ? JSON.parse(keys.chapters) : null).toEqual([
      "pronunciation-tones",
      "greetings",
    ]);
  });
});

export {};
