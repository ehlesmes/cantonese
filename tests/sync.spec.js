/* global localStorage, Buffer */
import { test, expect } from "@playwright/test";

test.describe("Progress Sync E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure a clean baseline
    await page.goto("/cantonese");
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Mock kvdb.io POST/PUT writes globally so export generates QR codes instantly
    await page.route(
      "**/kvdb.io/canto_sync_bucket_8c89bdf2/**",
      async (route) => {
        if (
          route.request().method() === "POST" ||
          route.request().method() === "PUT"
        ) {
          await route.fulfill({
            status: 200,
            contentType: "text/plain",
            body: "OK",
          });
        } else {
          await route.fallback();
        }
      },
    );
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
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["pronunciation-jyutping"]),
      );
      localStorage.setItem("cantonese_srs_state", JSON.stringify({}));
      localStorage.setItem("cantonese_vocab_srs_state", JSON.stringify({}));
    });

    // Load page with valid import parameter (using URL-safe base64)
    const base64 = Buffer.from(
      JSON.stringify({
        c: ["pronunciation-jyutping", "greetings", "shopping-slang"],
        s: { "phr-11-abcd12": [3, 1718985600] },
        v: {},
        t: 1718985600,
      }),
    ).toString("base64");
    const cleanPayload = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

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

  test("should handle import parameter with space characters (plus signs converted by URL search parameters)", async ({
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

    // A valid progress state Base64 containing a "+" character:
    // JSON: {"c":[0,1],"s":{},"v":{"vocab-test¾":[2,1718985600]},"t":1718985600000}
    const base64WithPlus =
      "eyJjIjpbMCwxXSwicyI6e30sInYiOnsidm9jYWItdGVzdMK+IjpbMiwxNzE4OTg1NjAwXX0sInQiOjE3MTg5ODU2MDAwMDB9";

    // Replace "+" with " " (space) to simulate standard browser search parameter parsing
    const spacePayload = base64WithPlus.replace(/\+/g, " ");

    await page.goto(`/cantonese?import=${spacePayload}`);

    // Confirmation view should open successfully (meaning decoding succeeded without SyntaxError)
    const confirmView = page.locator("#sync-confirm-view");
    await expect(confirmView).toBeVisible();

    const syncConfirmNo = page.locator("#sync-confirm-no");
    await syncConfirmNo.click();
    await expect(confirmView).not.toBeVisible();
  });

  test("should auto-open the merge confirmation modal when loaded with sync parameter", async ({
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

    const progressObj = {
      c: ["pronunciation-jyutping", "greetings", "shopping-slang"],
      s: { "phr-11-abcd12": [3, 1718985600] },
      v: {},
      t: 1718985600,
    };
    const base64 = Buffer.from(JSON.stringify(progressObj)).toString("base64");
    const cleanPayload = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Mock API fetch response for key ABCDEF
    await page.route(
      "**/kvdb.io/canto_sync_bucket_8c89bdf2/ABCDEF",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "text/plain",
          body: cleanPayload,
        });
      },
    );

    await page.goto("/cantonese?sync=ABCDEF");

    const confirmView = page.locator("#sync-confirm-view");
    await expect(confirmView).toBeVisible();

    const localChapters = page.locator("#confirm-chapters-local");
    const mergedChapters = page.locator("#confirm-chapters-merged");
    await expect(localChapters).toHaveText("1");
    await expect(mergedChapters).toHaveText("3");

    const syncConfirmNo = page.locator("#sync-confirm-no");
    await syncConfirmNo.click();
    await expect(confirmView).not.toBeVisible();
  });

  test("should retrieve progress when typing a 6-character sync code", async ({
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

    const progressObj = {
      c: ["pronunciation-jyutping", "greetings"],
      s: {},
      v: { "vocab-你好_neihhou": [2, 1718985600] },
      t: 1718985600,
    };
    const base64 = Buffer.from(JSON.stringify(progressObj)).toString("base64");
    const cleanPayload = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Mock API fetch response for key XYZ123
    await page.route(
      "**/kvdb.io/canto_sync_bucket_8c89bdf2/XYZ123",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "text/plain",
          body: cleanPayload,
        });
      },
    );

    // Open sync modal
    const syncBtn = page.locator("#sync-trigger-btn");
    await syncBtn.click();

    // Go to Import tab
    const tabImportBtn = page.locator("#tab-import-btn");
    await tabImportBtn.click();

    // Type code XYZ123 and click Sync
    const syncCodeInput = page.locator("#sync-code-input");
    await syncCodeInput.fill("xyz123");

    const syncCodeSubmitBtn = page.locator("#sync-code-submit-btn");
    await syncCodeSubmitBtn.click();

    const confirmView = page.locator("#sync-confirm-view");
    await expect(confirmView).toBeVisible();

    const localVocab = page.locator("#confirm-vocab-local");
    const mergedVocab = page.locator("#confirm-vocab-merged");
    await expect(localVocab).toHaveText("0");
    await expect(mergedVocab).toHaveText("1");

    const syncConfirmNo = page.locator("#sync-confirm-no");
    await syncConfirmNo.click();
    await expect(confirmView).not.toBeVisible();
  });
});
