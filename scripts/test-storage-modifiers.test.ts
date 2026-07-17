import { describe, test, expect } from "vitest";
import {
  removeChapterProgressState,
  cleanIncompleteProgressState,
} from "../src/utils/storage-modifiers.js";
import type { UserProgress } from "../src/types/index.js";

describe("Storage Modifiers Utility", () => {
  const getInitialState = (): UserProgress => ({
    unlockedChapters: ["chapter1", "chapter2"],
    phraseSrs: {
      p1: { level: 2, lastReviewed: 100 },
      p2: { level: 3, lastReviewed: 200 },
      p3: { level: 1, lastReviewed: 300 },
    },
    vocabSrs: {
      v1: { level: 5, lastReviewed: 400 },
      v2: { level: 2, lastReviewed: 500 },
      v3: { level: 4, lastReviewed: 600 },
    },
  });

  test("removeChapterProgressState removes chapter and its associated SRS data", () => {
    const state = getInitialState();
    const chapterData = {
      phrases: ["p1", "p3"],
      vocab: ["v2"],
    };

    const newState = removeChapterProgressState(state, "chapter1", chapterData);

    expect(newState.unlockedChapters).toEqual(["chapter2"]);
    expect(newState.phraseSrs).toEqual({
      p2: { level: 3, lastReviewed: 200 },
    });
    expect(newState.vocabSrs).toEqual({
      v1: { level: 5, lastReviewed: 400 },
      v3: { level: 4, lastReviewed: 600 },
    });

    // Ensure original state was not mutated (pure function check)
    expect(state.unlockedChapters).toEqual(["chapter1", "chapter2"]);
    expect(state.phraseSrs.p1).toBeDefined();
  });

  test("cleanIncompleteProgressState deletes data for incomplete chapters and orphaned keys", () => {
    const state = getInitialState();
    // Add orphaned items to state
    state.phraseSrs["p99"] = { level: 1, lastReviewed: 100 };
    state.vocabSrs["v99"] = { level: 1, lastReviewed: 100 };

    // chapter1 is unlocked, chapter2 is unlocked, chapter3 is locked
    const allChapters = [
      { id: "chapter1", phrases: ["p1"], vocab: ["v1"] },
      { id: "chapter2", phrases: ["p2"], vocab: ["v2"] },
      { id: "chapter3", phrases: ["p3"], vocab: ["v3"] }, // locked
      { id: "chapter4", phrases: ["p4"], vocab: ["v4"] }, // locked, but p4/v4 are not in srs
    ];

    const result = cleanIncompleteProgressState(state, allChapters);

    expect(result.newState.unlockedChapters).toEqual(["chapter1", "chapter2"]);
    // p3 and v3 should be removed since they belong to locked chapter3
    // p99 and v99 should be removed because they are completely orphaned
    expect(result.newState.phraseSrs).toEqual({
      p1: { level: 2, lastReviewed: 100 },
      p2: { level: 3, lastReviewed: 200 },
    });
    expect(result.newState.vocabSrs).toEqual({
      v1: { level: 5, lastReviewed: 400 },
      v2: { level: 2, lastReviewed: 500 },
    });
    // 1 locked (p3) + 1 orphaned (p99) = 2
    expect(result.cleanedPhrasesCount).toBe(2);
    // 1 locked (v3) + 1 orphaned (v99) = 2
    expect(result.cleanedVocabCount).toBe(2);
  });
});
