import { test, expect } from "./coverage-fixture.js";

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

    // 3. Go to review board
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // Assert that the chapters count is 2 (Greetings, Shopping), and cards count is 27
    await expect(page.locator("#stats-chapters-count")).toHaveText("2");
    await expect(page.locator("#stats-cards-count")).toHaveText("27");

    // Verify localStorage has been updated/normalized
    const storedAfterLoad = await page.evaluate(() =>
      localStorage.getItem("cantonese_unlocked_chapters"),
    );
    expect(storedAfterLoad ? JSON.parse(storedAfterLoad) : null).toEqual([
      "greetings",
      "shopping-slang",
    ]);
  });

  test("should accept swapped order of identical duplicate tokens", async ({
    page,
  }) => {
    // 1. Seed localStorage and intercept __allExamples before page load
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      const targetCard = {
        id: "test-card-duplicate",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "Greetings",
        cantoneseRaw: "我[ngo5|I] 好[hou2|very] 我[ngo5|I] 唔[m4|not]",
        english: "I very I not",
        tokens: ["我[ngo5|I]", "好[hou2|very]", "我[ngo5|I]", "唔[m4|not]"],
        type: "example",
        audioHash: "mock-audio-hash",
        tokenHashes: { 我: "hash-ngo", 好: "hash-hou", 唔: "hash-m" },
      };

      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
        set() {},
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

    // Scrambled pool locator helper
    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Click chips in order, swapping the duplicate "我" tokens
    // 1. "我" (click the second one first to swap order!)
    await getChip("我").nth(1).click();
    // 2. "好"
    await getChip("好").click();
    // 3. "我" (click the remaining first one)
    await getChip("我").first().click();
    // 4. "唔"
    await getChip("唔").click();

    // 4. Click check answer
    await page.click("#game-check-btn");

    // Verify feedback panel shows success/correct
    const feedbackText = await page.textContent("#feedback-panel");
    expect(feedbackText).toContain("Correct!");
    expect(feedbackText).toContain("SRS Level Up");
  });

  test("should accept swapped punctuation marks (e.g., comma, period, exclamation mark)", async ({
    page,
  }) => {
    // 1. Seed localStorage and intercept __allExamples before page load
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      const targetCard = {
        id: "test-card-punctuation",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "Greetings",
        cantoneseRaw: "好[hou2|good]，我[ngo5|I]！",
        english: "Good, me!",
        tokens: ["好[hou2|good]", "，", "我[ngo5|I]", "！"],
        type: "example",
        audioHash: "mock-audio-hash",
        tokenHashes: { 好: "hash-hou", 我: "hash-ngo" },
      };

      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
        set() {},
        configurable: true,
      });
    });

    // 2. Go to review board
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    // Scrambled pool locator helper
    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Click tokens in order, but swap the punctuation marks!
    // Correct order: 好 -> ， -> 我 -> ！
    // Swapped punctuation order: 好 -> ！ -> 我 -> ，
    await getChip("好").click();
    await getChip("！").click();
    await getChip("我").click();
    await getChip("，").click();

    // 4. Click check answer
    await page.click("#game-check-btn");

    // Verify feedback panel shows success/correct (lenient check passed)
    const feedbackText = await page.textContent("#feedback-panel");
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
        JSON.stringify(["greetings"]),
      );

      const targetCard = {
        id: "test-card-deselect",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "Greetings",
        cantoneseRaw: "我[ngo5|I] 好[hou2|very] 唔[m4|not]",
        english: "I very not",
        tokens: ["我[ngo5|I]", "好[hou2|very]", "唔[m4|not]"],
        type: "example",
        audioHash: "mock-audio-hash",
        tokenHashes: { 我: "hash-ngo", 好: "hash-hou", 唔: "hash-m" },
      };

      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
        set() {},
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
    expect(initialChips.length).toBe(3);

    const firstChipText = initialChips[0];
    await page.locator("#game-tokens-pool .token-chip").first().click();

    // Verify chip is removed from pool
    const poolChipsAfterClick = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(poolChipsAfterClick.length).toBe(2);
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
    expect(poolChipsAfterDeselect.length).toBe(3);
    expect(poolChipsAfterDeselect[2]).toBe(firstChipText);
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

      const targetCard = {
        id: "test-card-autoplay",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "Greetings",
        cantoneseRaw: "我[ngo5|I]",
        english: "I",
        tokens: ["我[ngo5|I]"],
        type: "example",
        audioHash: "mock-audio-hash",
        tokenHashes: { 我: "hash-ngo" },
      };

      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
        set() {},
        configurable: true,
      });
    });

    // 2. Go to phrasebook
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Assemble correct answer: "我"
    await getChip("我").click();

    // 4. Click check answer
    await page.click("#game-check-btn");
    await page.waitForSelector("#feedback-panel");

    // 5. Assert that the tts-btn in the feedback panel has 'tts-playing' class indicating autoplay was triggered
    const ttsBtn = page.locator("#feedback-panel .tts-btn");
    await expect(ttsBtn).toHaveClass(/tts-playing/);
  });

  test("should fallback to SpeechSynthesis when audio file playback fails", async ({
    page,
  }) => {
    // 1. Seed localStorage and intercept __allExamples before page load to have a known short list
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      // Force play to throw/reject to trigger fallback path
      window.HTMLAudioElement.prototype.play = function () {
        return Promise.reject(new Error("Playback blocked or file not found"));
      };
      window.HTMLAudioElement.prototype.pause = function () {};

      // Track speechSynthesis speak calls
      (
        window as unknown as { speechSynthesisSpoken: string[] }
      ).speechSynthesisSpoken = [];
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = (
          utterance: SpeechSynthesisUtterance,
        ) => {
          (
            window as unknown as { speechSynthesisSpoken: string[] }
          ).speechSynthesisSpoken.push(utterance.text);
          // Trigger onend callback asynchronously if mock synthesis is used
          if (utterance.onend) {
            setTimeout(utterance.onend, 100);
          }
        };
      }

      const targetCard = {
        id: "test-card-fallback",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "Greetings",
        cantoneseRaw: "我[ngo5|I]",
        english: "I",
        tokens: ["我[ngo5|I]"],
        type: "example",
        audioHash: "mock-audio-hash",
        tokenHashes: { 我: "hash-ngo" },
      };

      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
        set() {},
        configurable: true,
      });
    });

    // 2. Go to phrasebook
    await page.goto("/cantonese/phrasebook");
    await page.waitForSelector("#stats-cards-count");

    // 3. Start the session
    await page.click("#start-session-btn");
    await page.waitForSelector("#game-tokens-pool");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Assemble correct answer: "我"
    await getChip("我").click();

    // 4. Click check answer (which triggers autoplay play() which rejects, triggering fallback)
    await page.click("#game-check-btn");
    await page.waitForSelector("#feedback-panel");

    // Wait a brief moment for the fallback path to execute
    await page.waitForTimeout(200);

    // 5. Assert that speechSynthesis was called with clean Cantonese text "我"
    const spoken = await page.evaluate(
      () =>
        (window as unknown as { speechSynthesisSpoken: string[] })
          .speechSynthesisSpoken,
    );
    expect(spoken).toContain("我");
  });
});

export {};
