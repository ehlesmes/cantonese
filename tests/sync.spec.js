/* global localStorage, Buffer */
import { test, expect } from "@playwright/test";
import zlib from "zlib";

test.describe("Progress Sync E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean baseline
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("should open the sync modal and generate an Offer QR code canvas", async ({
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

    // The QR canvas should eventually display (meaning Offer + candidates generated successfully)
    const qrCanvas = page.locator("#sync-qr-canvas");
    await expect(qrCanvas).toBeVisible();

    // Status should prompt Initiator
    const statusText = page.locator("#sync-status-text");
    await expect(statusText).toContainText(
      "Device A: Point Device B at this QR code",
    );
  });

  test("should auto-open the modal and show Answer QR code when loaded with rtc offer parameter", async ({
    page,
  }) => {
    // 1. Generate a mock WebRTC Offer signaling token
    const mockOffer = {
      t: "o",
      u: "mockufra", // 8 chars minimum
      p: "mockpwdmockpwdmockpwd123", // 24 chars minimum (ICE password constraint)
      f: "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890",
      c: [["127.0.0.1", 5000]],
    };

    const compressed = zlib.deflateSync(Buffer.from(JSON.stringify(mockOffer)));
    const token = compressed.toString("base64url");

    // 2. Load page with rtc query parameter
    await page.goto(`/cantonese?rtc=${token}`);

    // Modal overlay should open automatically
    const modalOverlay = page.locator("#sync-modal-overlay");
    await expect(modalOverlay).toHaveClass(/open/);

    // Status should transition to answer mode (indicating offer parsed and answer generated)
    const statusText = page.locator("#sync-status-text");
    await expect(statusText).toContainText(
      "Device B: Point Device A at this Answer QR code",
    );

    // QR canvas should display the Answer QR
    const qrCanvas = page.locator("#sync-qr-canvas");
    await expect(qrCanvas).toBeVisible();
  });

  test("should allow syncing progress via offline copy-paste fallback", async ({
    page,
  }) => {
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["pronunciation-jyutping"]),
      );
      localStorage.setItem("cantonese_srs_state", JSON.stringify({}));
      localStorage.setItem("cantonese_vocab_srs_state", JSON.stringify({}));
    });

    // Open sync modal
    const syncBtn = page.locator("#sync-trigger-btn");
    await syncBtn.click();

    // Toggle offline fallback
    const offlineToggleBtn = page.locator("#sync-offline-toggle-btn");
    await expect(offlineToggleBtn).toBeVisible();
    await offlineToggleBtn.click();

    // Verify offline view is displayed
    const offlineView = page.locator("#sync-offline-view");
    await expect(offlineView).toBeVisible();

    // Generate valid progress string
    const base64 = Buffer.from(
      JSON.stringify({
        c: ["pronunciation-jyutping", "greetings", "dining-out"],
        s: {},
        v: { "vocab-你好_neihhou": [3, 1718985600] },
        t: 1718985600,
      }),
    ).toString("base64");
    const cleanPayload = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Paste import string
    const importStringTextarea = page.locator("#sync-import-string");
    await importStringTextarea.fill(cleanPayload);

    // Submit import
    const importSubmitBtn = page.locator("#sync-import-submit-btn");
    await importSubmitBtn.click();

    // Confirmation view should open
    const confirmView = page.locator("#sync-confirm-view");
    await expect(confirmView).toBeVisible();

    const localChapters = page.locator("#confirm-chapters-local");
    const mergedChapters = page.locator("#confirm-chapters-merged");
    await expect(localChapters).toHaveText("1");
    await expect(mergedChapters).toHaveText("3");

    // Click cancel
    const syncConfirmNo = page.locator("#sync-confirm-no");
    await syncConfirmNo.click();
    await expect(confirmView).not.toBeVisible();
  });
});
