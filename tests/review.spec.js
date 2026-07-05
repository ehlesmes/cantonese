/* global localStorage, window, setTimeout */
import { test, expect } from "@playwright/test";

test.describe("Review Board Legacy / String State Compatibility Tests", () => {
  test("should handle string-typed chapters in localStorage and load cards", async ({
    page,
  }) => {
    // 1. Go to the page (to set context/origin)
    await page.goto("/cantonese");

    // 2. Set string-typed array in localStorage to simulate legacy user state
    await page.evaluate(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings", "shopping-slang"]),
      );
    });

    page.on("console", (msg) => {
      console.log("BROWSER LOG:", msg.type(), msg.text());
    });

    page.on("pageerror", (err) => {
      console.error("BROWSER PAGE ERROR:", err.message);
    });

    // 3. Go to review board
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // Check stats count
    const statsChapters = await page.textContent("#stats-chapters-count");
    const statsCards = await page.textContent("#stats-cards-count");
    console.log("Legacy test - Stats chapters count:", statsChapters);
    console.log("Legacy test - Stats cards count:", statsCards);

    // Assert that the chapters count is 2 (Greetings, Shopping), and cards count is 27
    expect(statsChapters).toBe("2");
    expect(statsCards).toBe("27");

    // Verify localStorage has been updated/normalized
    const storedAfterLoad = await page.evaluate(() =>
      localStorage.getItem("cantonese_unlocked_chapters"),
    );
    console.log("Normalized localStorage value:", storedAfterLoad);
    expect(JSON.parse(storedAfterLoad)).toEqual([
      "greetings",
      "shopping-slang",
    ]);
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
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["diner-ordering"]),
      );

      let val;
      Object.defineProperty(window, "__allExamples", {
        get() {
          return val;
        },
        set(newVal) {
          val = newVal;
          // Find the specific card with duplicate tokens
          const targetCard = val.find((c) => c.id === "phr-11-1v3vktn");
          if (targetCard) {
            val.length = 0;
            val.push(targetCard);
          }
        },
        configurable: true,
      });
    });

    // 2. Go to review board
    await page.goto("/cantonese/phrasebook");
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

    // Click chips in order, swapping the two identical duplicate "，" and "一" tokens
    // 1. "好"
    await getChip("好").click();
    // 2. "，" (click the second one first to swap order!)
    await getChip("，").nth(1).click();
    // 3. "一" (click the second one first to swap order!)
    await getChip("一").nth(1).click();
    // 4. "個"
    await getChip("個").click();
    // 5. "菠蘿包"
    await getChip("菠蘿包").click();
    // 6. "，" (click the remaining first one)
    await getChip("，").first().click();
    // 7. "一" (click the remaining first one)
    await getChip("一").first().click();
    // 8. "杯"
    await getChip("杯").click();
    // 9. "凍"
    await getChip("凍").click();
    // 10. "奶茶"
    await getChip("奶茶").click();
    // 11. "。"
    await getChip("。").click();

    // 4. Click check answer
    await page.click("#game-check-btn");

    // Verify feedback panel shows success/correct
    const feedbackText = await page.textContent("#feedback-panel");
    console.log("Feedback content text:", feedbackText);
    expect(feedbackText).toContain("Correct!");
    expect(feedbackText).toContain("SRS Level Up");
  });

  test("should preserve scrambled order of pool tokens when deselecting a token", async ({
    page,
  }) => {
    // 1. Seed localStorage and intercept __allExamples before page load
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["diner-ordering"]),
      );

      let val;
      Object.defineProperty(window, "__allExamples", {
        get() {
          return val;
        },
        set(newVal) {
          val = newVal;
          const targetCard = val.find((c) => c.id === "phr-11-1v3vktn");
          if (targetCard) {
            val.length = 0;
            val.push(targetCard);
          }
        },
        configurable: true,
      });
    });

    // 2. Go to review board and start the session
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    // Read the initial scrambled chips list
    const initialChips = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(initialChips.length).toBeGreaterThan(5);

    // Click a unique chip to move it to answerSlots (avoiding duplicate token collision in assertions)
    let targetIndex = 0;
    for (let i = 0; i < initialChips.length; i++) {
      const chip = initialChips[i];
      if (initialChips.filter((c) => c === chip).length === 1) {
        targetIndex = i;
        break;
      }
    }
    const firstChipText = initialChips[targetIndex];
    await page
      .locator("#game-tokens-pool .token-chip")
      .nth(targetIndex)
      .click();

    // Verify chip is removed from pool
    const poolChipsAfterClick = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(poolChipsAfterClick.length).toBe(initialChips.length - 1);
    expect(poolChipsAfterClick).not.toContain(firstChipText);

    // Verify chip is present in answer slots
    const answerSlotsText = await page
      .locator("#game-answer-slots .token-chip")
      .allTextContents();
    expect(answerSlotsText).toEqual([firstChipText]);

    // Click to deselect it from answerSlots
    await page.locator("#game-answer-slots .token-chip").first().click();

    // Verify it returned to the pool (at the end)
    const poolChipsAfterDeselect = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(poolChipsAfterDeselect.length).toBe(initialChips.length);
    expect(poolChipsAfterDeselect[poolChipsAfterDeselect.length - 1]).toBe(
      firstChipText,
    );

    // Critical assertion: The pool does not sort itself into grammatical order.
    const correctPrefix = "好hou2good";
    if (firstChipText !== correctPrefix) {
      expect(poolChipsAfterDeselect[0]).not.toBe(correctPrefix);
    }
  });
});

test.describe("Autoplay Audio Tests", () => {
  test("should automatically play audio when revealing the answer in Vocabulary", async ({
    page,
  }) => {
    // 1. Seed localStorage and mock Audio/SpeechSynthesis
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      // Mock audio play to return a long-running/pending promise so tts-playing class persists
      window.HTMLAudioElement.prototype.play = function () {
        return new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      };
      window.HTMLAudioElement.prototype.pause = function () {};

      // Mock speechSynthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = () => {};
      }
    });

    // 2. Go to Vocabulary
    await page.goto("/cantonese/vocabulary");
    await page.waitForSelector("#stats-cards-count");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#flashcard-character-container");

    // 4. Reveal answer
    await page.click("#flashcard-reveal-btn");
    await page.waitForSelector("#flashcard-answer-section");

    // 5. Assert that the vocab term has the 'tts-playing' class indicating autoplay was triggered
    const term = page.locator("#flashcard-character-container .vocab-term");
    await expect(term).toHaveClass(/tts-playing/);
  });

  test("should automatically play audio when checking the answer in Phrasebook", async ({
    page,
  }) => {
    // 1. Seed localStorage and intercept __allExamples before page load to have a known short list
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["diner-ordering"]),
      );

      // Mock audio play to return a long-running/pending promise so tts-playing class persists
      window.HTMLAudioElement.prototype.play = function () {
        return new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      };
      window.HTMLAudioElement.prototype.pause = function () {};

      // Mock speechSynthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = () => {};
      }

      let val;
      Object.defineProperty(window, "__allExamples", {
        get() {
          return val;
        },
        set(newVal) {
          val = newVal;
          // Find the specific card with duplicate tokens
          const targetCard = val.find((c) => c.id === "phr-11-1v3vktn");
          if (targetCard) {
            val.length = 0;
            val.push(targetCard);
          }
        },
        configurable: true,
      });
    });

    // 2. Go to phrasebook
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    const getChip = (text) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Assemble correct answer: "好", "，", "一", "個", "菠蘿包", "，", "一", "杯", "凍", "奶茶", "。"
    await getChip("好").click();
    await getChip("，").first().click();
    await getChip("一").first().click();
    await getChip("個").click();
    await getChip("菠蘿包").click();
    await getChip("，").first().click(); // click remaining
    await getChip("一").first().click(); // click remaining
    await getChip("杯").click();
    await getChip("凍").click();
    await getChip("奶茶").click();
    await getChip("。").click();

    // 4. Click check answer
    await page.click("#game-check-btn");
    await page.waitForSelector("#feedback-panel");

    // 5. Assert that the tts-btn in the feedback panel has 'tts-playing' class indicating autoplay was triggered
    const ttsBtn = page.locator("#feedback-panel .tts-btn");
    await expect(ttsBtn).toHaveClass(/tts-playing/);
  });
});
