/* global localStorage, Buffer */
import { test, expect } from "@playwright/test";

test.describe("Progress Sync E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean baseline
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("should open the sync modal and generate a QR code canvas", async ({
    page,
  }) => {
    await page.goto("/cantonese");

    // Check that the Sync button in the header is present and click it
    const syncBtn = page.locator("#sync-trigger-btn");
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // The modal overlay should open
    const modalOverlay = page.locator("#sync-modal-overlay");
    await expect(modalOverlay).toHaveClass(/open/);

    // The QR canvas should eventually display
    const qrCanvas = page.locator("#sync-qr-canvas");
    await expect(qrCanvas).toBeVisible();

    // The Export String should be populated with the serialized state
    const exportInput = page.locator("#sync-export-string");
    await expect(exportInput).toHaveValue(/.+/);
  });

  test("should auto-open the merge confirmation modal when loaded with import parameter", async ({
    page,
  }) => {
    // Seed local state: Chapter 0 unlocked, phrasebook has 0 reviews
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.setItem("cantonese_unlocked_chapters", JSON.stringify([0]));
      localStorage.setItem("cantonese_srs_state", JSON.stringify({}));
      localStorage.setItem("cantonese_vocab_srs_state", JSON.stringify({}));
    });

    // Load page with valid import parameter
    const cleanPayload = Buffer.from(
      JSON.stringify({
        c: [0, 1, 2],
        s: { "ch1-ex0": [3, 1718985600] },
        v: {},
        t: 1718985600,
      }),
    ).toString("base64");

    await page.goto(`/cantonese?import=${cleanPayload}`);

    // Modal overlay and confirmation view should be visible automatically
    const modalOverlay = page.locator("#sync-modal-overlay");
    await expect(modalOverlay).toHaveClass(/open/);

    const confirmView = page.locator("#sync-confirm-view");
    await expect(confirmView).toBeVisible();

    // Verify compared metrics display
    const localChapters = page.locator("#confirm-chapters-local");
    const mergedChapters = page.locator("#confirm-chapters-merged");
    const localSrs = page.locator("#confirm-srs-local");
    const mergedSrs = page.locator("#confirm-srs-merged");

    await expect(localChapters).toHaveText("1"); // Just Chapter 0
    await expect(mergedChapters).toHaveText("3"); // Chapters 0, 1, 2
    await expect(localSrs).toHaveText("0"); // 0 reviewed items locally
    await expect(mergedSrs).toHaveText("1"); // 1 item imported

    // Click cancel
    const syncConfirmNo = page.locator("#sync-confirm-no");
    await syncConfirmNo.click();

    // Modal should now be closed/hidden
    await expect(confirmView).not.toBeVisible();
  });
});
