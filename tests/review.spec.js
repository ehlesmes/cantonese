/* global localStorage, window */
import { test, expect } from "@playwright/test";

test.describe("Review Board Legacy / String State Compatibility Tests", () => {
  test("should handle string-typed chapters in localStorage, convert them to numbers, and load cards", async ({
    page,
  }) => {
    // 1. Go to the page (to set context/origin)
    await page.goto("/cantonese");

    // 2. Set string-typed array in localStorage to simulate legacy user state
    await page.evaluate(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["1", "2"]),
      );
    });

    page.on("console", (msg) => {
      console.log("BROWSER LOG:", msg.type(), msg.text());
    });

    page.on("pageerror", (err) => {
      console.error("BROWSER PAGE ERROR:", err.message);
    });

    // 3. Go to review board
    await page.goto("/cantonese/review");
    await page.waitForSelector("#stats-cards-count");

    // Check stats count
    const statsChapters = await page.textContent("#stats-chapters-count");
    const statsCards = await page.textContent("#stats-cards-count");
    console.log("Legacy test - Stats chapters count:", statsChapters);
    console.log("Legacy test - Stats cards count:", statsCards);

    // Assert that the chapters count is 2 (Chapter 1 and 2), and cards count is 48 (22 + 26)
    expect(statsChapters).toBe("2");
    expect(statsCards).toBe("48");

    // Check if the checkboxes for 1 and 2 are checked
    const ch1Checked = await page
      .locator(".chapter-toggle-cb[data-chapter='1']")
      .isChecked();
    const ch2Checked = await page
      .locator(".chapter-toggle-cb[data-chapter='2']")
      .isChecked();
    const ch0Checked = await page
      .locator(".chapter-toggle-cb[data-chapter='0']")
      .isChecked();

    console.log("Checkboxes state in legacy test:");
    console.log("Ch 0 checked:", ch0Checked);
    console.log("Ch 1 checked:", ch1Checked);
    console.log("Ch 2 checked:", ch2Checked);

    expect(ch0Checked).toBe(false);
    expect(ch1Checked).toBe(true);
    expect(ch2Checked).toBe(true);

    // Verify localStorage has been updated/normalized to numbers
    const storedAfterLoad = await page.evaluate(() =>
      localStorage.getItem("cantonese_unlocked_chapters"),
    );
    console.log("Normalized localStorage value:", storedAfterLoad);
    expect(storedAfterLoad).toBe("[1,2]");
  });

  test("should accept swapped order of identical duplicate tokens", async ({
    page,
  }) => {
    page.on("console", (msg) => {
      console.log("DUPLICATE TEST BROWSER LOG:", msg.type(), msg.text());
    });

    page.on("pageerror", (err) => {
      console.error("DUPLICATE TEST BROWSER PAGE ERROR:", err.message);
    });

    // 1. Seed localStorage and intercept __allExamples before page load
    await page.addInitScript(() => {
      localStorage.setItem("cantonese_unlocked_chapters", JSON.stringify([3]));

      let val;
      Object.defineProperty(window, "__allExamples", {
        get() {
          return val;
        },
        set(newVal) {
          val = newVal;
          // Find the specific card with duplicate tokens
          const targetCard = val.find((c) => c.id === "ch3-dg9");
          if (targetCard) {
            val.length = 0;
            val.push(targetCard);
          }
        },
        configurable: true,
      });
    });

    // 2. Go to review board
    await page.goto("/cantonese/review");
    await page.waitForSelector("#stats-cards-count");

    // Verify stats cards count is 1
    const poolCount = await page.textContent("#stats-cards-count");
    expect(poolCount).toBe("1");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    const chipsText = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    console.log("Chips in pool:", chipsText);

    // Scrambled pool locator helper
    const getChip = (text) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Click chips in order, swapping the two identical duplicate "，一" tokens (normally at index 1 and 4)
    // 1. "好"
    await getChip("好").click();
    // 2. "，一" (click the second one first to swap order!)
    await getChip("，一").nth(1).click();
    // 3. "個"
    await getChip("個").click();
    // 4. "菠蘿包"
    await getChip("菠蘿包").click();
    // 5. "，一" (click the remaining first one)
    await getChip("，一").first().click();
    // 6. "杯"
    await getChip("杯").click();
    // 7. "凍"
    await getChip("凍").click();
    // 8. "奶茶"
    await getChip("奶茶").click();
    // 9. "。"
    await getChip("。").click();

    // 4. Click check answer
    await page.click("#game-check-btn");

    // Verify feedback panel shows success/correct
    const feedbackText = await page.textContent("#feedback-panel");
    console.log("Feedback content text:", feedbackText);
    expect(feedbackText).toContain("Correct!");
    expect(feedbackText).toContain("SRS Level Up");
  });
});
