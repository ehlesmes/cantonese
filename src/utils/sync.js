/* global window, localStorage, TextEncoder, TextDecoder */
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

// URL-safe Base64 character set
const BASE64URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Pure JS fallback to encode a Uint8Array to a URL-safe Base64 string (no padding).
 */
export function bytesToBase64Url(bytes) {
  let result = "";
  const l = bytes.length;
  for (let i = 0; i < l; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < l ? bytes[i + 1] : NaN;
    const b3 = i + 2 < l ? bytes[i + 2] : NaN;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    const enc3 = isNaN(b2) ? NaN : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    const enc4 = isNaN(b3) ? NaN : b3 & 63;

    result += BASE64URL_CHARS[enc1] + BASE64URL_CHARS[enc2];
    if (!isNaN(enc3)) result += BASE64URL_CHARS[enc3];
    if (!isNaN(enc4)) result += BASE64URL_CHARS[enc4];
  }
  return result;
}

/**
 * Pure JS fallback to decode a URL-safe Base64 string (without or with padding) into a Uint8Array.
 */
export function base64UrlToBytes(str) {
  const cleanStr = str
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const lookup = {};
  for (let i = 0; i < BASE64URL_CHARS.length; i++) {
    lookup[BASE64URL_CHARS[i]] = i;
  }

  const bytes = [];
  const l = cleanStr.length;
  for (let i = 0; i < l; i += 4) {
    const enc1 = lookup[cleanStr[i]];
    const enc2 = i + 1 < l ? lookup[cleanStr[i + 1]] : 0;
    const enc3 = i + 2 < l ? lookup[cleanStr[i + 2]] : NaN;
    const enc4 = i + 3 < l ? lookup[cleanStr[i + 3]] : NaN;

    if (
      enc1 === undefined ||
      enc2 === undefined ||
      (cleanStr[i + 2] !== undefined && enc3 === undefined) ||
      (cleanStr[i + 3] !== undefined && enc4 === undefined)
    ) {
      throw new Error("Invalid Base64 character");
    }

    const b1 = (enc1 << 2) | (enc2 >> 4);
    bytes.push(b1);

    if (!isNaN(enc3)) {
      const b2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      bytes.push(b2);
      if (!isNaN(enc4)) {
        const b3 = ((enc3 & 3) << 6) | enc4;
        bytes.push(b3);
      }
    }
  }
  return new Uint8Array(bytes);
}

// Detect browser support for standard native Base64 on Uint8Array
function hasNativeBase64() {
  return (
    typeof Uint8Array !== "undefined" &&
    typeof Uint8Array.prototype.toBase64 === "function" &&
    typeof Uint8Array.fromBase64 === "function"
  );
}

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
  const bytes = new TextEncoder().encode(jsonStr);

  if (hasNativeBase64()) {
    try {
      return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
    } catch {
      // Fallback
    }
  }

  return bytesToBase64Url(bytes);
}

/**
 * Deserializes and validates a progress string back into a standard state object
 */
export function deserializeState(serializedStr) {
  if (typeof serializedStr !== "string" || !serializedStr.trim()) {
    return null;
  }

  try {
    // Normalize string: convert space (which URLSearchParams decodes '+' as) to '+'
    // and standardize to URL-safe characters
    let cleanStr = serializedStr
      .trim()
      .replace(/ /g, "+") // Handle spaces decoded from URLSearchParams
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    let rawStr;
    if (hasNativeBase64()) {
      try {
        const decodedBytes = Uint8Array.fromBase64(cleanStr, {
          alphabet: "base64url",
          lastChunkHandling: "loose",
        });
        rawStr = new TextDecoder().decode(decodedBytes);
      } catch {
        // Fallback
      }
    }

    if (!rawStr) {
      const decodedBytes = base64UrlToBytes(cleanStr);
      rawStr = new TextDecoder().decode(decodedBytes);
    }

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
