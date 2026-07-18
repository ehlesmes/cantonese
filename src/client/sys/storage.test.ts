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
  getLocalState,
  saveLocalState,
} from "./storage.js";

describe("Storage Utilities Spec", () => {
  beforeEach(() => {
    if (typeof localStorage === "undefined" || !localStorage.clear) {
      let store: Record<string, string> = {};
      global.localStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: unknown) => (store[key] = String(value)),
        removeItem: (key: string) => delete store[key],
        clear: () => (store = {}),
        length: 0,
        key: () => null,
      };
    }
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("should handle missing localStorage (SSR fallback)", () => {
    // Temporarily hide window object to simulate SSR
    const originalWindow = global.window;
    // @ts-expect-error Testing SSR fallback
    delete global.window;

    expect(getUnlockedChapters()).toEqual([]);
    expect(saveUnlockedChapters(["test"])).toBe(false);

    expect(getPhraseSRS()).toEqual({});
    expect(savePhraseSRS({ a: { level: 1, lastReviewed: 0 } })).toBe(false);

    expect(getVocabSRS()).toEqual({});
    expect(saveVocabSRS({ b: { level: 2, lastReviewed: 0 } })).toBe(false);

    expect(() => clearAllProgress()).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  test("should return empty array if unlocked chapters JSON parses to a non-array value", () => {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify({ notAnArray: true }),
    );
    expect(getUnlockedChapters()).toEqual([]);
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
    const state = { "phrase-1": { level: 2, lastReviewed: 0 } };
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
    savePhraseSRS({ p1: { level: 1, lastReviewed: 0 } });
    saveVocabSRS({ v1: { level: 1, lastReviewed: 0 } });

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

    expect(savePhraseSRS({ p1: { level: 1, lastReviewed: 0 } })).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to save phrase SRS state"),
      expect.any(Error),
    );

    expect(saveVocabSRS({ v1: { level: 1, lastReviewed: 0 } })).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to save vocab SRS state"),
      expect.any(Error),
    );
  });

  describe("Compound Local State Storage", () => {
    test("saveLocalState writes merged state to localStorage", () => {
      if (typeof localStorage === "undefined" || !localStorage.clear) {
        let store: Record<string, string> = {};
        global.localStorage = {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: unknown) =>
            (store[key] = String(value)),
          removeItem: (key: string) => delete store[key],
          clear: () => (store = {}),
          length: 0,
          key: () => null,
        } as Storage;
      }
      localStorage.clear();
      const state = {
        chapters: ["chap1"],
        srs: { "phr-1": { level: 1, lastReviewed: 12345 } },
        vocab: { "vocab-1": { level: 2, lastReviewed: 67890 } },
      };

      const success = saveLocalState(state);
      expect(success).toBe(true);

      expect(localStorage.getItem("cantonese_unlocked_chapters")).toContain(
        "chap1",
      );
      expect(localStorage.getItem("cantonese_srs_state")).toContain("phr-1");
      expect(localStorage.getItem("cantonese_vocab_srs_state")).toContain(
        "vocab-1",
      );
    });

    test("saveLocalState handles QuotaExceededError and returns false", () => {
      vi.spyOn(global.localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const state = { chapters: [], srs: {}, vocab: {} };
      const success = saveLocalState(state);
      expect(success).toBe(false);

      vi.restoreAllMocks();
    });

    test("saveLocalState returns false when window is undefined", () => {
      const originalWindow = global.window;
      // @ts-expect-error Testing SSR fallback
      delete global.window;

      const state = { chapters: [], srs: {}, vocab: {} };
      const success = saveLocalState(state);
      expect(success).toBe(false);

      global.window = originalWindow;
    });

    test("getLocalState retrieves data from localStorage", () => {
      localStorage.clear();
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(["chap1"]),
      );
      localStorage.setItem(
        "cantonese_srs_state",
        JSON.stringify({ "phr-1": { level: 2 } }),
      );
      localStorage.setItem(
        "cantonese_vocab_srs_state",
        JSON.stringify({ "v-1": { level: 3 } }),
      );

      const localState = getLocalState();
      expect(localState.chapters).toEqual(["chap1"]);
      expect(localState.srs["phr-1"]?.level).toBe(2);
      expect(localState.vocab["v-1"]?.level).toBe(3);
    });

    test("getLocalState handles exceptions and returns defaults", () => {
      vi.spyOn(global.localStorage, "getItem").mockImplementation(() => {
        throw new Error("Localstorage read block");
      });
      const localState = getLocalState();
      expect(localState.chapters).toEqual([]);
      expect(localState.srs).toEqual({});
      expect(localState.vocab).toEqual({});
      vi.restoreAllMocks();
    });
  });
});

export {};
