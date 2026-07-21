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
    await expect(page.locator(".remove-btn").first()).toBeVisible();

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
    await expect(page.locator(".remove-btn").first()).toBeVisible();

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

  test("should allow removing progress for a single chapter", async ({
    page,
  }) => {
    await page.goto("/cantonese/advanced");
    await expect(page.locator(".remove-btn").first()).toBeVisible();

    // Click the first "Remove Progress" button (for pronunciation-tones)
    const removeBtns = page.locator(".remove-btn");
    await removeBtns.first().click();

    // Verify confirmation modal is displayed
    const confirmModal = page.locator("#confirm-modal");
    await expect(confirmModal).toHaveClass(/show/);

    // Click confirm in modal
    await page.locator("#modal-confirm-btn").click();

    // Verify it is removed from list
    await expect(page.locator(".chapter-row")).toHaveCount(1);

    // Verify localStorage has greetings but not pronunciation-tones
    const keys = await page.evaluate(() => {
      return localStorage.getItem("cantonese_unlocked_chapters");
    });
    expect(keys ? JSON.parse(keys) : null).toEqual(["greetings"]);
  });

  test("should allow cleaning up SRS data for incomplete chapters", async ({
    page,
  }) => {
    // Seed SRS data for an incomplete chapter (e.g. shopping which is not unlocked)
    await page.addInitScript(() => {
      Object.defineProperty(window, "__allChaptersData", {
        value: [
          {
            id: "pronunciation-tones",
            number: 0,
            title: "Tones",
            phrases: ["phr-tones-card"],
            vocab: ["vocab-tones-card"],
          },
          {
            id: "shopping",
            number: 2,
            title: "Shopping",
            phrases: ["phr-shopping-card"],
            vocab: ["vocab-shopping-card"],
          },
        ],
        writable: false,
        configurable: true,
      });

      window.localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["pronunciation-tones"]),
      );
      window.localStorage.setItem(
        "cantonese_srs_state",
        JSON.stringify({
          "phr-tones-card": { level: 2 }, // completed chapter tones
          "phr-shopping-card": { level: 4 }, // incomplete chapter shopping
        }),
      );
      window.localStorage.setItem(
        "cantonese_vocab_srs_state",
        JSON.stringify({
          "vocab-tones-card": { level: 3 }, // completed chapter tones
          "vocab-shopping-card": { level: 5 }, // incomplete chapter shopping
        }),
      );
    });

    await page.goto("/cantonese/advanced");
    await expect(page.locator("#clean-incomplete-btn")).toBeVisible();

    // Click clean incomplete button
    await page.locator("#clean-incomplete-btn").click();

    // Verify confirmation modal is displayed
    const confirmModal = page.locator("#confirm-modal");
    await expect(confirmModal).toHaveClass(/show/);

    // Click confirm in modal
    await page.locator("#modal-confirm-btn").click();

    // Verify incomplete chapter cards are removed from local storage
    const srsState = await page.evaluate(() => {
      return {
        phr: localStorage.getItem("cantonese_srs_state"),
        vocab: localStorage.getItem("cantonese_vocab_srs_state"),
      };
    });

    const phrParsed = (srsState.phr ? JSON.parse(srsState.phr) : {}) as Record<
      string,
      unknown
    >;
    const vocabParsed = (
      srsState.vocab ? JSON.parse(srsState.vocab) : {}
    ) as Record<string, unknown>;

    // Completed tones is kept, incomplete shopping is cleaned
    expect(phrParsed["phr-tones-card"]).toBeDefined();
    expect(phrParsed["phr-shopping-card"]).toBeUndefined();
    expect(vocabParsed["vocab-tones-card"]).toBeDefined();
    expect(vocabParsed["vocab-shopping-card"]).toBeUndefined();
  });
});

export {};
