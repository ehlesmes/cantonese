import { describe, test, expect } from "vitest";
import {
  serializeState,
  deserializeState,
  mergeStates,
} from "../src/utils/sync.js";

describe("Progress Sync Utility Spec", () => {
  test("serialization and deserialization roundtrip preserves progress state", async () => {
    const originalState = {
      chapters: ["pronunciation-jyutping", "greetings", "dining-out"],
      srs: {
        "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
        "phr-5-abcde": { level: 5, lastReviewed: 1718985900000 },
      },
      vocab: {
        "vocab-你好_neihhou": { level: 1, lastReviewed: 1718985700000 },
        "vocab-smart-quote-’": { level: 4, lastReviewed: 1718985800000 },
      },
    };

    const serialized = await serializeState(originalState);
    expect(typeof serialized).toBe("string");
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = await deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized.chapters).toEqual([
      "pronunciation-jyutping",
      "greetings",
      "dining-out",
    ]);

    // Check phrasebook srs
    expect(deserialized.srs["phr-11-1v3vktn"]).toBeDefined();
    expect(deserialized.srs["phr-11-1v3vktn"].level).toBe(2);
    expect(deserialized.srs["phr-11-1v3vktn"].lastReviewed).toBe(1718985600000);
    expect(deserialized.srs["phr-5-abcde"].level).toBe(5);
    expect(deserialized.srs["phr-5-abcde"].lastReviewed).toBe(1718985900000);

    // Check vocabulary srs
    expect(deserialized.vocab["vocab-你好_neihhou"]).toBeDefined();
    expect(deserialized.vocab["vocab-你好_neihhou"].level).toBe(1);
    expect(deserialized.vocab["vocab-你好_neihhou"].lastReviewed).toBe(
      1718985700000,
    );
    expect(deserialized.vocab["vocab-smart-quote-’"]).toBeDefined();
    expect(deserialized.vocab["vocab-smart-quote-’"].level).toBe(4);
    expect(deserialized.vocab["vocab-smart-quote-’"].lastReviewed).toBe(
      1718985800000,
    );

    expect(deserialized.timestamp).toBeGreaterThan(0);
  });

  test("fallback serialization and deserialization roundtrip (pure JS) preserves progress state", async () => {
    // Temporarily delete native methods to force fallback code execution
    const origToBase64 = Uint8Array.prototype.toBase64;
    const origFromBase64 = Uint8Array.fromBase64;
    delete Uint8Array.prototype.toBase64;
    delete Uint8Array.fromBase64;

    try {
      const originalState = {
        chapters: ["pronunciation-jyutping", "greetings", "dining-out"],
        srs: {
          "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
        },
        vocab: {
          "vocab-你好_neihhou": { level: 1, lastReviewed: 1718985700000 },
          "vocab-smart-quote-’": { level: 4, lastReviewed: 1718985800000 },
        },
      };

      const serialized = await serializeState(originalState);
      expect(typeof serialized).toBe("string");
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = await deserializeState(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized.chapters).toEqual([
        "pronunciation-jyutping",
        "greetings",
        "dining-out",
      ]);
      expect(deserialized.vocab["vocab-smart-quote-’"].level).toBe(4);
    } finally {
      // Restore native methods
      Uint8Array.prototype.toBase64 = origToBase64;
      Uint8Array.fromBase64 = origFromBase64;
    }
  });

  test("deserialization handles Base64 strings with spaces (plus signs replaced by URL decoding)", async () => {
    const originalState = {
      chapters: ["pronunciation-jyutping", "greetings"],
      srs: {
        "phr-11-1v3vktn": { level: 2, lastReviewed: 1718985600000 },
      },
      vocab: {},
    };

    const serialized = await serializeState(originalState);

    // Convert any URL-safe '-' back to '+' (or standard base64 '+') and replace with spaces
    // to simulate standard browser URLSearchParams parsing.
    const base64WithPlus = serialized.replace(/-/g, "+");
    const base64WithSpace = base64WithPlus.replace(/\+/g, " ");

    const deserialized = await deserializeState(base64WithSpace);
    expect(deserialized).not.toBeNull();
    expect(deserialized.chapters).toEqual([
      "pronunciation-jyutping",
      "greetings",
    ]);
    expect(deserialized.srs["phr-11-1v3vktn"].level).toBe(2);
  });

  test("deserialization returns null for corrupted/invalid strings", async () => {
    const badState = await deserializeState("invalid-base64-string!");
    expect(badState).toBeNull();
  });

  test("mergeStates successfully unions chapters", () => {
    const local = {
      chapters: ["pronunciation-jyutping", "greetings"],
      srs: {},
      vocab: {},
    };
    const imported = {
      chapters: ["pronunciation-jyutping", "dining-out"],
      srs: {},
      vocab: {},
    };

    const merged = mergeStates(local, imported);
    expect(merged.chapters).toEqual([
      "dining-out",
      "greetings",
      "pronunciation-jyutping",
    ]);
  });

  test("mergeStates applies latest-timestamp-wins logic for overlapping items", () => {
    const local = {
      chapters: ["pronunciation-jyutping"],
      srs: {
        // Laptop reviewed this more recently (yesterday vs last week)
        "item-conflict-local-newer": { level: 2, lastReviewed: 1718985600000 },
        // Phone reviewed this more recently
        "item-conflict-imported-newer": {
          level: 1,
          lastReviewed: 1718900000000,
        },
        // Unique to laptop
        "item-local-only": { level: 4, lastReviewed: 1718985600000 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 3, lastReviewed: 1718985600000 },
        "vocab-conflict-imported-newer": {
          level: 1,
          lastReviewed: 1718900000000,
        },
        "vocab-local-only": { level: 5, lastReviewed: 1718985600000 },
      },
    };

    const imported = {
      chapters: ["pronunciation-jyutping"],
      srs: {
        "item-conflict-local-newer": { level: 5, lastReviewed: 1718900000000 }, // older
        "item-conflict-imported-newer": {
          level: 3,
          lastReviewed: 1718985600000,
        }, // newer
        // Unique to phone
        "item-imported-only": { level: 2, lastReviewed: 1718900000000 },
      },
      vocab: {
        "vocab-conflict-local-newer": { level: 5, lastReviewed: 1718900000000 },
        "vocab-conflict-imported-newer": {
          level: 3,
          lastReviewed: 1718985600000,
        },
        "vocab-imported-only": { level: 2, lastReviewed: 1718900000000 },
      },
    };

    const merged = mergeStates(local, imported);

    // Verify phrasebook srs merging
    expect(merged.srs["item-conflict-local-newer"].level).toBe(2); // local won
    expect(merged.srs["item-conflict-local-newer"].lastReviewed).toBe(
      1718985600000,
    );

    expect(merged.srs["item-conflict-imported-newer"].level).toBe(3); // imported won
    expect(merged.srs["item-conflict-imported-newer"].lastReviewed).toBe(
      1718985600000,
    );

    expect(merged.srs["item-local-only"].level).toBe(4);
    expect(merged.srs["item-imported-only"].level).toBe(2);

    // Verify vocab srs merging
    expect(merged.vocab["vocab-conflict-local-newer"].level).toBe(3); // local won
    expect(merged.vocab["vocab-conflict-imported-newer"].level).toBe(3); // imported won
    expect(merged.vocab["vocab-local-only"].level).toBe(5);
    expect(merged.vocab["vocab-imported-only"].level).toBe(2);
  });
});
