import { describe, it, expect, beforeEach, vi } from "vitest";
import { VocabularyPage } from "./vocabulary_page.js";
import { Progress } from "../shared/progress.js";
import { VocabularyItem } from "../vocabulary_item/vocabulary_item.js";

describe("VocabularyPage Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("should show empty state when no exercises are unlocked", async () => {
    const page = new VocabularyPage();
    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 0));

    const emptyState = page.shadowRoot.querySelector(".empty-state");
    expect(emptyState.textContent).toContain("No vocabulary unlocked yet");
  });

  it("should render items for unlocked exercises", async () => {
    // 1. Setup Progress
    Progress.addExercisesToPractice(["1/1/1.1.2.json"]);

    // 2. Mock Fetch
    const mockExercise = {
      cantonese: "你好",
      romanization: "nei5 hou2",
      translation: "Hello",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.includes("1.1.2.json")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockExercise),
          });
        }
        return Promise.reject("Not found");
      }),
    );

    const page = new VocabularyPage();
    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 50));

    const items = page.shadowRoot.querySelectorAll("div.vocab-list > div");
    expect(items.length).toBe(1);
    expect(items[0].component).toBeInstanceOf(VocabularyItem);
    expect(items[0].component._data.level).toBe(1);
  });

  it("should handle unscramble format correctly", async () => {
    Progress.addExercisesToPractice(["1/1/1.1.3.json"]);

    const mockUnscramble = {
      tokens: [
        ["我", "ngo5"],
        ["係", "hai6"],
      ],
      translation: "I am",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUnscramble),
        }),
      ),
    );

    const page = new VocabularyPage();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const item = page.shadowRoot.querySelector("div.vocab-list > div");
    expect(item.component).toBeInstanceOf(VocabularyItem);

    // The item should have converted tokens to strings
    expect(item.component._data.cantonese).toBe("我係");
  });

  it("should correctly display exercises after lesson completion (integration)", async () => {
    // 1. Simulate Lesson Completion (mimicking LessonViewer logic)
    const lessonId = "1.1";
    const lessonData = [
      { type: "reading", pageId: "1.1.2" },
      { type: "unscramble", pageId: "1.1.3" },
      { type: "congratulations", pageId: "1.1.4" },
    ];

    Progress.completeLesson(lessonId);
    const [chapter, lessonNum] = lessonId.split(".");
    const exerciseIds = lessonData
      .filter((p) => p.type === "reading" || p.type === "unscramble")
      .map((p) => `${chapter}/${lessonNum}/${p.pageId}.json`);
    Progress.addExercisesToPractice(exerciseIds);

    // 2. Mock Fetch for these exercises
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.includes("1.1.2.json")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                cantonese: "你好",
                romanization: "nei5 hou2",
                translation: "Hello",
              }),
          });
        }
        if (url.includes("1.1.3.json")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                tokens: [
                  ["我", "ngo5"],
                  ["係", "hai6"],
                ],
                translation: "I am",
              }),
          });
        }
        return Promise.reject("Not found");
      }),
    );

    const page = new VocabularyPage();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const items = page.shadowRoot.querySelectorAll("div.vocab-list > div");
    expect(items.length).toBe(2);

    // Verify first item (Reading)
    expect(items[0].component._data.cantonese).toBe("你好");

    // Verify second item (Unscramble)
    expect(items[1].component._data.cantonese).toBe("我係");

    // Verify SRS levels are initialized to 1
    expect(items[0].component._data.level).toBe(1);
  });
});
