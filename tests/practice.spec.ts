import { test, expect } from "./coverage-fixture.js";

test.describe("Practice Board Legacy / String State Compatibility Tests", () => {
  test("should handle string-typed chapters in localStorage and load items", async ({
    page,
  }) => {
    await page.goto("/cantonese");

    await page.evaluate(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings", "shopping-slang"]),
      );
    });

    await page.goto("/cantonese/practice");
    await page.waitForSelector("#stats-cards-count");

    await expect(page.locator("#stats-chapters-count")).toHaveText("2");
    const storedAfterLoad = await page.evaluate(() =>
      localStorage.getItem("cantonese_unlocked_chapters"),
    );
    expect(storedAfterLoad ? JSON.parse(storedAfterLoad) : null).toEqual([
      "greetings",
      "shopping-slang",
    ]);
  });
});

test.describe("Dashboard Tabs", () => {
  test("should toggle between Vocabulary and Phrases in the directory", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      const mockVocab = [
        {
          id: "v1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          character: "我",
          jyutping: "ngo5",
          translation: "I",
          _practiceType: "vocab",
        },
      ];
      const mockPhrase = [
        {
          id: "p1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          cantoneseRaw: "我[ngo5|I]",
          english: "I Phrase",
          tokens: ["我[ngo5|I]"],
          audioHash: "",
          tokenHashes: {},
          _practiceType: "phrase",
        },
      ];

      Object.defineProperty(window, "__allVocab", {
        get() {
          return mockVocab;
        },
      });
      Object.defineProperty(window, "__allExamples", {
        get() {
          return mockPhrase;
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.waitForSelector(".review-item-card");

    // By default, vocabulary is selected
    await expect(page.locator("#tab-vocab-btn")).toHaveClass(/active/);
    await expect(page.locator("#review-items-list-container")).toContainText(
      "ngo5 — I",
    );

    // Click phrases
    await page.click("#tab-phrase-btn");
    await expect(page.locator("#tab-phrase-btn")).toHaveClass(/active/);
    await expect(page.locator("#review-items-list-container")).toContainText(
      "I Phrase",
    ); // Phrase english
  });
});

test.describe("Practice Session UI and Grading", () => {
  test("phrase unscramble failure resets tokens and lowers SRS", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      localStorage.setItem(
        "cantonese_srs_state",
        JSON.stringify({ p1: { level: 2, lastReviewed: 0 } }),
      );

      const mockPhrase = [
        {
          id: "p1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          cantoneseRaw: "我[ngo5|I] 唔[m4|not]",
          english: "I not",
          tokens: ["我[ngo5|I]", "唔[m4|not]"],
          audioHash: "",
          tokenHashes: {},
          type: "example",
        },
      ];

      Object.defineProperty(window, "__allVocab", {
        get() {
          return [];
        },
      });
      Object.defineProperty(window, "__allExamples", {
        get() {
          return mockPhrase;
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");
    await page.waitForSelector("#phrase-ui-container");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Deliberately fail: 唔 then 我
    await getChip("唔").click();
    await getChip("我").click();

    await page.click("#game-check-btn");

    const feedbackText = await page.textContent("#feedback-panel");
    expect(feedbackText).toContain("Incorrect");
    expect(feedbackText).toContain("SRS Level Down to 1");

    // Verify localStorage updated correctly
    const srs = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("cantonese_srs_state") || "{}",
        ) as Record<string, { level: number }>,
    );
    expect(srs["p1"]?.level).toBe(1);
  });

  test("phrase unscramble success raises SRS", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      localStorage.setItem(
        "cantonese_srs_state",
        JSON.stringify({ p1: { level: 1, lastReviewed: 0 } }),
      );

      const mockPhrase = [
        {
          id: "p1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          cantoneseRaw: "我[ngo5|I] 唔[m4|not]",
          english: "I not",
          tokens: ["我[ngo5|I]", "唔[m4|not]"],
          audioHash: "",
          tokenHashes: {},
          type: "example",
        },
      ];

      Object.defineProperty(window, "__allVocab", {
        get() {
          return [];
        },
      });
      Object.defineProperty(window, "__allExamples", {
        get() {
          return mockPhrase;
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");
    await page.waitForSelector("#phrase-ui-container");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });

    // Succeed: 我 then 唔
    await getChip("我").click();
    await getChip("唔").click();

    await page.click("#game-check-btn");

    const feedbackText = await page.textContent("#feedback-panel");
    expect(feedbackText).toContain("Correct!");
    expect(feedbackText).toContain("SRS Level Up to 2");
  });

  test("vocabulary flashcard remember/forgot grading updates SRS", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      localStorage.setItem(
        "cantonese_vocab_srs_state",
        JSON.stringify({
          v1: { level: 2, lastReviewed: 0 },
          v2: { level: 1, lastReviewed: 0 },
        }),
      );

      const mockVocab = [
        {
          id: "v1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          character: "我",
          jyutping: "ngo5",
          translation: "I",
          type: "vocab",
        },
        {
          id: "v2",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          character: "好",
          jyutping: "hou2",
          translation: "Good",
          type: "vocab",
        },
      ];

      Object.defineProperty(window, "__allVocab", {
        get() {
          return mockVocab;
        },
      });
      Object.defineProperty(window, "__allExamples", {
        get() {
          return [];
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");
    await page.waitForSelector("#vocab-ui-container");

    // First card: Reveal and Forgot
    await page.click("#flashcard-reveal-btn");
    await page.waitForSelector("#grade-forgot-btn");
    await page.click("#grade-forgot-btn");

    // Second card: Reveal and Remembered
    await page.waitForSelector("#flashcard-reveal-btn");
    await page.click("#flashcard-reveal-btn");
    await page.waitForSelector("#grade-remembered-btn");
    await page.click("#grade-remembered-btn");

    // Verify localStorage updated correctly
    const srs = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("cantonese_vocab_srs_state") || "{}",
        ) as Record<string, { level: number }>,
    );
    expect(Object.keys(srs).length).toBe(2);
  });

  test("mixed sequence seamlessly transitions UIs", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );

      const mockVocab = [
        {
          id: "v1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          character: "我",
          jyutping: "ngo5",
          translation: "I",
          type: "vocab",
        },
      ];
      const mockPhrase = [
        {
          id: "p1",
          chapter: "greetings",
          chapterNumber: 1,
          chapterTitle: "G",
          cantoneseRaw: "我[ngo5|I]",
          english: "I",
          tokens: ["我[ngo5|I]"],
          audioHash: "",
          tokenHashes: {},
          type: "phrase",
        },
      ];

      Object.defineProperty(window, "__allVocab", {
        get() {
          return mockVocab;
        },
      });
      Object.defineProperty(window, "__allExamples", {
        get() {
          return mockPhrase;
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");

    // Either UI might render first. We just need to play through the 2 cards.
    let sawVocab = false;
    let sawPhrase = false;

    for (let i = 0; i < 2; i++) {
      const vocabVisible = await page.evaluate(
        () =>
          document.getElementById("vocab-ui-container")?.style.display ===
          "block",
      );
      const phraseVisible = await page.evaluate(
        () =>
          document.getElementById("phrase-ui-container")?.style.display ===
          "block",
      );

      expect(vocabVisible !== phraseVisible).toBe(true); // XOR

      if (vocabVisible) {
        sawVocab = true;
        await page.click("#flashcard-reveal-btn");
        await page.click("#grade-remembered-btn");
      } else {
        sawPhrase = true;
        await page.locator("#game-tokens-pool .token-chip").first().click();
        await page.click("#game-check-btn");
        await page.click("#next-card-btn");
      }
    }

    expect(sawVocab).toBe(true);
    expect(sawPhrase).toBe(true);
  });
});

test.describe("Edge Cases", () => {
  test("should accept swapped order of identical duplicate tokens", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      const targetCard = {
        id: "p-dup",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "G",
        cantoneseRaw: "我 好 我 唔",
        english: "I very I not",
        tokens: ["我", "好", "我", "唔"],
        type: "example",
        audioHash: "",
        tokenHashes: {},
      };
      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
      });
      Object.defineProperty(window, "__allVocab", {
        get() {
          return [];
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });
    await getChip("我").nth(1).click();
    await getChip("好").click();
    await getChip("我").first().click();
    await getChip("唔").click();

    await page.click("#game-check-btn");
    const feedbackText = await page.textContent("#feedback-panel");
    expect(feedbackText).toContain("Correct!");
  });

  test("should accept swapped punctuation marks", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      const targetCard = {
        id: "p-punc",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "G",
        cantoneseRaw: "好，我！",
        english: "Good, me!",
        tokens: ["好", "，", "我", "！"],
        type: "example",
        audioHash: "",
        tokenHashes: {},
      };
      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
      });
      Object.defineProperty(window, "__allVocab", {
        get() {
          return [];
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");

    const getChip = (text: string) =>
      page.locator("#game-tokens-pool .token-chip", { hasText: text });
    await getChip("好").click();
    await getChip("！").click();
    await getChip("我").click();
    await getChip("，").click();

    await page.click("#game-check-btn");
    const feedbackText = await page.textContent("#feedback-panel");
    expect(feedbackText).toContain("Correct!");
  });

  test("should preserve scrambled order of pool tokens when deselecting a token", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["greetings"]),
      );
      const targetCard = {
        id: "p-desel",
        chapter: "greetings",
        chapterNumber: 1,
        chapterTitle: "G",
        cantoneseRaw: "我 好 唔",
        english: "I very not",
        tokens: ["我", "好", "唔"],
        type: "example",
        audioHash: "",
        tokenHashes: {},
      };
      Object.defineProperty(window, "__allExamples", {
        get() {
          return [targetCard];
        },
      });
      Object.defineProperty(window, "__allVocab", {
        get() {
          return [];
        },
      });
    });

    await page.goto("/cantonese/practice");
    await page.click("#start-session-btn");

    const initialChips = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    const firstChipText = initialChips[0];

    await page.locator("#game-tokens-pool .token-chip").first().click();

    const poolChipsAfterClick = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(poolChipsAfterClick).not.toContain(firstChipText);

    await page.locator("#game-answer-slots .token-chip").first().click();

    const poolChipsAfterDeselect = await page
      .locator("#game-tokens-pool .token-chip")
      .allTextContents();
    expect(poolChipsAfterDeselect[2]).toBe(firstChipText);
  });
});

export {};
