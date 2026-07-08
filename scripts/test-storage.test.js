/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  getUnlockedChapters,
  saveUnlockedChapters,
  getPhraseSRS,
  savePhraseSRS,
  getVocabSRS,
  saveVocabSRS,
  clearAllProgress,
} from "../src/utils/storage.js";

describe("Storage Utilities Spec", () => {
  beforeEach(() => {
    if (typeof localStorage === "undefined" || !localStorage.clear) {
      let store = {};
      global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => (store[key] = value.toString()),
        removeItem: (key) => delete store[key],
        clear: () => (store = {}),
      };
    }
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("should handle missing localStorage (SSR fallback)", () => {
    // Temporarily hide window object to simulate SSR
    const originalWindow = global.window;
    delete global.window;

    expect(getUnlockedChapters()).toEqual([]);
    expect(saveUnlockedChapters(["test"])).toBe(false);

    expect(getPhraseSRS()).toEqual({});
    expect(savePhraseSRS({ a: 1 })).toBe(false);

    // Restore window
    global.window = originalWindow;
  });

  test("should load and save unlocked chapters correctly", () => {
    const chapters = ["chap1", "chap2"];
    expect(saveUnlockedChapters(chapters)).toBe(true);
    expect(getUnlockedChapters()).toEqual(chapters);
  });

  test("should fallback gracefully if localStorage contains corrupted JSON for chapters", () => {
    localStorage.setItem("cantonese_unlocked_chapters", "{ invalid_json: ");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(getUnlockedChapters()).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  test("should filter out invalid chapter types", () => {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(["valid", 123, null]),
    );
    expect(getUnlockedChapters()).toEqual(["valid"]);
  });

  test("should load and save Phrase SRS state correctly", () => {
    const state = { "phrase-1": { level: 2 } };
    expect(savePhraseSRS(state)).toBe(true);
    expect(getPhraseSRS()).toEqual(state);
  });

  test("should fallback gracefully if phrase SRS state is corrupted", () => {
    localStorage.setItem("cantonese_srs_state", "undefined");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(getPhraseSRS()).toEqual({});
    expect(spy).toHaveBeenCalled();
  });

  test("should fallback gracefully if vocab SRS state is corrupted", () => {
    localStorage.setItem("cantonese_vocab_srs_state", "invalid-json");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(getVocabSRS()).toEqual({});
    expect(spy).toHaveBeenCalled();
  });

  test("should clear all progress", () => {
    saveUnlockedChapters(["c1"]);
    savePhraseSRS({ p1: 1 });
    saveVocabSRS({ v1: 1 });

    clearAllProgress();

    expect(getUnlockedChapters()).toEqual([]);
    expect(getPhraseSRS()).toEqual({});
    expect(getVocabSRS()).toEqual({});
  });

  test("should handle QuotaExceededError when saving", () => {
    vi.spyOn(global.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(saveUnlockedChapters(["c1"])).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to save unlocked chapters"),
      expect.any(Error),
    );

    expect(savePhraseSRS({ p1: 1 })).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to save phrase SRS state"),
      expect.any(Error),
    );

    expect(saveVocabSRS({ v1: 1 })).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to save vocab SRS state"),
      expect.any(Error),
    );
  });
});
