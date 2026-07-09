import { test, expect } from "./coverage-fixture.js";
import { packSDPData } from "../src/utils/webrtc.js";
import type { SDPCoordinates } from "../src/types/index.js";

test.describe("Progress Sync E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean baseline
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("should open the sync modal and generate an Offer QR code canvas in Show tab", async ({
    page,
  }) => {
    await page.goto("/cantonese");

    // Click the sync trigger button
    const syncBtn = page.locator("#sync-trigger-btn");
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // The modal overlay should open
    const modalOverlay = page.locator("#sync-modal-overlay");
    await expect(modalOverlay).toHaveClass(/open/);

    // Show tab button should be active
    const tabShowBtn = page.locator("#tab-show-btn");
    await expect(tabShowBtn).toHaveClass(/active/);

    // The QR canvas should display inside the Show panel
    const qrCanvas = page.locator("#sync-tab-show-content #sync-qr-canvas");
    await expect(qrCanvas).toBeVisible();

    // Status text should show waiting status
    const statusText = page.locator("#sync-status-text");
    await expect(statusText).toContainText("Waiting for connection");
  });

  test("should auto-open the Scan tab and show Answer QR code when loaded with rtc offer parameter", async ({
    page,
  }) => {
    // 1. Generate a mock WebRTC Offer signaling token
    const mockOffer: SDPCoordinates = {
      t: "o",
      u: "mockufra",
      p: "mockpwdmockpwdmockpwd123",
      f: "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890",
      c: [["127.0.0.1", 5000]],
    };

    const token = packSDPData(mockOffer);

    // 2. Load page with rtc query parameter
    await page.goto(`/cantonese?rtc=${token}`);

    // Modal overlay should open automatically
    const modalOverlay = page.locator("#sync-modal-overlay");
    await expect(modalOverlay).toHaveClass(/open/);

    // Scan tab button should be active automatically
    const tabScanBtn = page.locator("#tab-scan-btn");
    await expect(tabScanBtn).toHaveClass(/active/);

    // Answer QR section should be visible, and scanner section hidden
    const answerQrSection = page.locator("#answer-qr-section");
    await expect(answerQrSection).toBeVisible();
    const scannerSection = page.locator("#scanner-section");
    await expect(scannerSection).not.toBeVisible();

    // Answer QR canvas should be visible
    const answerQrCanvas = page.locator("#answer-qr-canvas");
    await expect(answerQrCanvas).toBeVisible();

    // Status text should show answer generated status
    const statusText = page.locator("#sync-status-text");
    await expect(statusText).toContainText("Answer generated");
  });

  test("should allow syncing progress via offline copy-paste fallback", async ({
    page,
  }) => {
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["pronunciation-tones"]),
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
        c: ["pronunciation-tones", "greetings", "dining-out"],
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

  test("should show validation warning when pasting corrupted progress string", async ({
    page,
  }) => {
    await page.goto("/cantonese");

    // Open sync modal
    const syncBtn = page.locator("#sync-trigger-btn");
    await syncBtn.click();

    // Toggle offline fallback
    const offlineToggleBtn = page.locator("#sync-offline-toggle-btn");
    await offlineToggleBtn.click();

    // Paste corrupted progress string (e.g., random characters)
    const importStringTextarea = page.locator("#sync-import-string");
    await importStringTextarea.fill("corrupted-random-payload-value!");

    // Submit import
    const importSubmitBtn = page.locator("#sync-import-submit-btn");
    await importSubmitBtn.click();

    // Verify warning status is displayed and contains error text
    const offlineError = page.locator("#sync-offline-error");
    await expect(offlineError).toBeVisible();
    await expect(offlineError).toContainText("Invalid sync code");
  });
});

export {};
