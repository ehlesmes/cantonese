/* global window, localStorage, btoa, atob */
/**
 * Sync Utility functions for Colloquial Cantonese course progress.
 * Serializes, validates, and merges localStorage progress data.
 */

// Shorthand mapper keys to keep URL/QR payloads compact
const SHORT_KEYS = {
  chapters: "c",
  srs: "s",
  vocab: "v",
  timestamp: "t",
};

/**
 * Reads local storage progress states
 */
export function getLocalState() {
  let chapters = [0];
  let srs = {};
  let vocab = {};

  if (typeof window !== "undefined") {
    try {
      const storedChapters = localStorage.getItem(
        "cantonese_unlocked_chapters",
      );
      if (storedChapters) {
        chapters = JSON.parse(storedChapters).map(Number);
      }

      const storedSRS = localStorage.getItem("cantonese_srs_state");
      if (storedSRS) {
        srs = JSON.parse(storedSRS);
      }

      const storedVocab = localStorage.getItem("cantonese_vocab_srs_state");
      if (storedVocab) {
        vocab = JSON.parse(storedVocab);
      }
    } catch (e) {
      console.error("Failed to read local storage state:", e);
    }
  }

  return { chapters, srs, vocab };
}

/**
 * Compacts and serializes progress state into a URL-safe Base64 string
 */
export function serializeState(state) {
  const compacted = {
    [SHORT_KEYS.chapters]: state.chapters || [0],
    [SHORT_KEYS.srs]: {},
    [SHORT_KEYS.vocab]: {},
    [SHORT_KEYS.timestamp]: Date.now(),
  };

  // Compact srs: Map { level, lastReviewed } to [level, Math.floor(lastReviewed/1000)]
  if (state.srs) {
    for (const [id, item] of Object.entries(state.srs)) {
      if (item && typeof item.level === "number") {
        compacted[SHORT_KEYS.srs][id] = [
          item.level,
          item.lastReviewed ? Math.floor(item.lastReviewed / 1000) : 0,
        ];
      }
    }
  }

  // Compact vocab
  if (state.vocab) {
    for (const [id, item] of Object.entries(state.vocab)) {
      if (item && typeof item.level === "number") {
        compacted[SHORT_KEYS.vocab][id] = [
          item.level,
          item.lastReviewed ? Math.floor(item.lastReviewed / 1000) : 0,
        ];
      }
    }
  }

  const jsonStr = JSON.stringify(compacted);

  // Encode string safely for URL query params using btoa and encodeURIComponent
  // This supports Unicode characters (such as Cantonese characters in vocabulary IDs)
  const base64 = btoa(
    encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }),
  );

  // Make Base64 URL-safe (replace + with -, / with _, and strip trailing =)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Deserializes and validates a progress string back into a standard state object
 */
export function deserializeState(serializedStr) {
  if (typeof serializedStr !== "string" || !serializedStr.trim()) {
    return null;
  }

  try {
    // Restore standard Base64 characters from URL-safe ones
    // Convert ' ' back to '+' (in case URL search param decoding replaced '+' with space)
    let base64 = serializedStr
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/ /g, "+");

    // Restore padding if length is not a multiple of 4
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }

    const rawStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    const compacted = JSON.parse(rawStr);

    // Validate overall structure
    if (!compacted || typeof compacted !== "object") {
      throw new Error("Invalid payload structure");
    }

    const state = {
      chapters: compacted[SHORT_KEYS.chapters] || [0],
      srs: {},
      vocab: {},
      timestamp: compacted[SHORT_KEYS.timestamp] || 0,
    };

    // Expand srs: Map [level, timestamp] to { level, lastReviewed }
    const srsData = compacted[SHORT_KEYS.srs] || {};
    for (const [id, arr] of Object.entries(srsData)) {
      if (Array.isArray(arr) && arr.length >= 2) {
        state.srs[id] = {
          level: Number(arr[0]),
          lastReviewed: Number(arr[1]) * 1000,
        };
      }
    }

    // Expand vocab
    const vocabData = compacted[SHORT_KEYS.vocab] || {};
    for (const [id, arr] of Object.entries(vocabData)) {
      if (Array.isArray(arr) && arr.length >= 2) {
        state.vocab[id] = {
          level: Number(arr[0]),
          lastReviewed: Number(arr[1]) * 1000,
        };
      }
    }

    return state;
  } catch (e) {
    console.error("Failed to deserialize progress state:", e);
    return null;
  }
}

/**
 * Smart-merges imported state with the current local state
 */
export function mergeStates(local, imported) {
  const merged = {
    chapters: [],
    srs: {},
    vocab: {},
  };

  // Merge unlocked chapters (Union)
  const allChapters = [
    ...(local.chapters || [0]),
    ...(imported.chapters || [0]),
  ];
  merged.chapters = [...new Set(allChapters)].map(Number).sort((a, b) => a - b);

  // Merge helper for key-value stores (latest timestamp wins)
  const mergeStore = (localStore, importedStore) => {
    const mergedStore = {};
    const allKeys = new Set([
      ...Object.keys(localStore || {}),
      ...Object.keys(importedStore || {}),
    ]);

    for (const id of allKeys) {
      const localItem = localStore?.[id];
      const importedItem = importedStore?.[id];

      if (localItem && importedItem) {
        // Both exist: choose the one with the latest lastReviewed timestamp
        const localTime = localItem.lastReviewed || 0;
        const importedTime = importedItem.lastReviewed || 0;
        mergedStore[id] = importedTime >= localTime ? importedItem : localItem;
      } else {
        // Only one exists: keep it
        mergedStore[id] = importedItem || localItem;
      }
    }
    return mergedStore;
  };

  merged.srs = mergeStore(local.srs, imported.srs);
  merged.vocab = mergeStore(local.vocab, imported.vocab);

  return merged;
}

/**
 * Saves merged progress back into local storage
 */
export function saveLocalState(state) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "cantonese_unlocked_chapters",
        JSON.stringify(state.chapters),
      );
      localStorage.setItem("cantonese_srs_state", JSON.stringify(state.srs));
      localStorage.setItem(
        "cantonese_vocab_srs_state",
        JSON.stringify(state.vocab),
      );
      return true;
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
      return false;
    }
  }
  return false;
}
