import type { SrsStateMap, CompactSyncPayload } from "../types";
import {
  getUnlockedChapters,
  getPhraseSRS,
  getVocabSRS,
  saveUnlockedChapters,
  savePhraseSRS,
  saveVocabSRS,
} from "./storage.js";

// Shorthand mapper keys to keep URL/QR payloads compact
const SHORT_KEYS = {
  chapters: "c" as const,
  srs: "s" as const,
  vocab: "v" as const,
  timestamp: "t" as const,
};

// URL-safe Base64 character set
const BASE64URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";


/**
 * Pure JS fallback to encode a Uint8Array to a URL-safe Base64 string (no padding).
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let result = "";
  const l = bytes.length;
  for (let i = 0; i < l; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = i + 1 < l ? (bytes[i + 1] ?? 0) : NaN;
    const b3 = i + 2 < l ? (bytes[i + 2] ?? 0) : NaN;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    const enc3 = isNaN(b2) ? NaN : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    const enc4 = isNaN(b3) ? NaN : b3 & 63;

    const char1 = BASE64URL_CHARS[enc1];
    const char2 = BASE64URL_CHARS[enc2];
    const char3 = isNaN(enc3) ? "" : BASE64URL_CHARS[enc3];
    const char4 = isNaN(enc4) ? "" : BASE64URL_CHARS[enc4];

    if (char1 !== undefined && char2 !== undefined) {
      result += char1 + char2;
    }
    if (char3) result += char3;
    if (char4) result += char4;
  }
  return result;
}

/**
 * Pure JS fallback to decode a URL-safe Base64 string (without or with padding) into a Uint8Array.
 */
export function base64UrlToBytes(str: string): Uint8Array {
  const cleanStr = str
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE64URL_CHARS.length; i++) {
    const char = BASE64URL_CHARS[i];
    if (char !== undefined) {
      lookup[char] = i;
    }
  }

  const bytes: number[] = [];
  const l = cleanStr.length;
  for (let i = 0; i < l; i += 4) {
    const char1 = cleanStr[i];
    const char2 = cleanStr[i + 1];
    const char3 = cleanStr[i + 2];
    const char4 = cleanStr[i + 3];

    if (char1 === undefined) break;

    const enc1 = lookup[char1];
    const enc2 = char2 !== undefined ? lookup[char2] : 0;
    const enc3 = char3 !== undefined ? lookup[char3] : NaN;
    const enc4 = char4 !== undefined ? lookup[char4] : NaN;

    if (
      enc1 === undefined ||
      enc2 === undefined ||
      (char3 !== undefined && enc3 === undefined) ||
      (char4 !== undefined && enc4 === undefined)
    ) {
      throw new Error("Invalid Base64 character");
    }

    const b1 = (enc1 << 2) | (enc2 >> 4);
    bytes.push(b1);

    if (enc3 !== undefined && !isNaN(enc3)) {
      const b2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      bytes.push(b2);
      if (enc4 !== undefined && !isNaN(enc4)) {
        const b3 = ((enc3 & 3) << 6) | enc4;
        bytes.push(b3);
      }
    }
  }
  return new Uint8Array(bytes);
}


interface ExtendedUint8Array extends Uint8Array {
  toBase64?(options?: { alphabet?: string; omitPadding?: boolean }): string;
}

interface ExtendedUint8ArrayConstructor {
  fromBase64?(str: string, options?: { alphabet?: string; lastChunkHandling?: string }): Uint8Array;
}



export interface LocalState {
  chapters: string[];
  srs: SrsStateMap;
  vocab: SrsStateMap;
  timestamp?: number;
}

/**
 * Reads local storage progress states
 */
export function getLocalState(): LocalState {
  const chapters = getUnlockedChapters();
  const srs = getPhraseSRS();
  const vocab = getVocabSRS();

  return { chapters, srs, vocab };
}

/**
 * Compresses raw text using CompressionStream (deflate).
 */
async function compressData(jsonStr: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(jsonStr);
  if (typeof CompressionStream !== "undefined") {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
    const compressedStream = stream.pipeThrough(
      new CompressionStream("deflate") as unknown as TransformStream<Uint8Array, Uint8Array>
    );
    const buffer = await new Response(compressedStream).arrayBuffer();
    return new Uint8Array(buffer);
  }
  throw new Error("CompressionStream is not supported by this browser");
}

/**
 * Decompresses bytes using DecompressionStream (deflate).
 */
async function decompressData(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream !== "undefined") {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream("deflate") as unknown as TransformStream<Uint8Array, Uint8Array>
    );
    const buffer = await new Response(decompressedStream).arrayBuffer();
    return new TextDecoder().decode(buffer);
  }
  throw new Error("DecompressionStream is not supported by this browser");
}

/**
 * Compacts and serializes progress state into a URL-safe Base64 string (Gzipped)
 */
export async function serializeState(state: LocalState): Promise<string> {
  const compacted: CompactSyncPayload = {
    [SHORT_KEYS.chapters]: state.chapters,
    [SHORT_KEYS.srs]: {},
    [SHORT_KEYS.vocab]: {},
    [SHORT_KEYS.timestamp]: Date.now(),
  };

  // Compact srs: Map { level, lastReviewed } to [level, Math.floor(lastReviewed/1000)]
  const srsCompacted: Record<string, [number, number]> = {};
  for (const [id, item] of Object.entries(state.srs || {})) {
    if (item && typeof item.level === "number") {
      srsCompacted[id] = [
        item.level,
        item.lastReviewed ? Math.floor(item.lastReviewed / 1000) : 0,
      ];
    }
  }
  compacted[SHORT_KEYS.srs] = srsCompacted;

  // Compact vocab
  const vocabCompacted: Record<string, [number, number]> = {};
  for (const [id, item] of Object.entries(state.vocab || {})) {
    if (item && typeof item.level === "number") {
      vocabCompacted[id] = [
        item.level,
        item.lastReviewed ? Math.floor(item.lastReviewed / 1000) : 0,
      ];
    }
  }
  compacted[SHORT_KEYS.vocab] = vocabCompacted;

  const jsonStr = JSON.stringify(compacted);
  let bytes: Uint8Array;
  try {
    bytes = await compressData(jsonStr);
  } catch {
    bytes = new TextEncoder().encode(jsonStr);
  }

  const extBytes = bytes as ExtendedUint8Array;
  if (typeof extBytes.toBase64 === "function") {
    try {
      return extBytes.toBase64({ alphabet: "base64url", omitPadding: true });
    } catch {
      // Fallback
    }
  }

  return bytesToBase64Url(bytes);
}

/**
 * Deserializes and validates a progress string back into a standard state object (handles Gzipped/raw formats)
 */
export async function deserializeState(
  serializedStr: string
): Promise<LocalState | null> {
  if (typeof serializedStr !== "string" || !serializedStr.trim()) {
    return null;
  }

  try {
    // Normalize string: convert space (which URLSearchParams decodes '+' as) to '+'
    // and standardize to URL-safe characters
    const cleanStr = serializedStr
      .trim()
      .replace(/ /g, "+") // Handle spaces decoded from URLSearchParams
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    let decodedBytes: Uint8Array | undefined;
    const uint8Const = Uint8Array as unknown as ExtendedUint8ArrayConstructor;
    if (typeof uint8Const.fromBase64 === "function") {
      try {
        decodedBytes = uint8Const.fromBase64(cleanStr, {
          alphabet: "base64url",
          lastChunkHandling: "loose",
        });
      } catch {
        // Fallback
      }
    }

    if (!decodedBytes) {
      decodedBytes = base64UrlToBytes(cleanStr);
    }

    let rawStr: string;
    try {
      rawStr = await decompressData(decodedBytes);
    } catch {
      try {
        rawStr = new TextDecoder("utf-8", { fatal: true }).decode(decodedBytes);
      } catch {
        throw new Error("Decompression and decoding failed");
      }
    }
    const compacted = JSON.parse(rawStr) as unknown;

    // Validate overall structure
    if (!compacted || typeof compacted !== "object" || Array.isArray(compacted)) {
      throw new Error("Invalid payload structure");
    }

    const payload = compacted as Record<string, unknown>;
    const rawChapters = payload[SHORT_KEYS.chapters] || [];
    const chapters = Array.isArray(rawChapters)
      ? (rawChapters as unknown[]).filter((c): c is string => typeof c === "string")
      : [];

    const state: LocalState = {
      chapters,
      srs: {},
      vocab: {},
      timestamp: typeof payload[SHORT_KEYS.timestamp] === "number" ? (payload[SHORT_KEYS.timestamp] as number) : 0,
    };

    // Expand srs: Map [level, timestamp] to { level, lastReviewed }
    const srsData = payload[SHORT_KEYS.srs] || {};
    if (srsData && typeof srsData === "object" && !Array.isArray(srsData)) {
      for (const [id, arr] of Object.entries(srsData as Record<string, unknown>)) {
        if (id.startsWith("ch")) {
          // Discard legacy indexed phrasebook progress
          continue;
        }
        if (Array.isArray(arr) && arr.length >= 1) {
          /* v8 ignore next 4 */
          state.srs[id] = {
            level: Number(arr[0] ?? 1),
            lastReviewed: Number(arr[1] ?? 0) * 1000,
          };
        }
      }
    }

    // Expand vocab
    const vocabData = payload[SHORT_KEYS.vocab] || {};
    if (vocabData && typeof vocabData === "object" && !Array.isArray(vocabData)) {
      for (const [id, arr] of Object.entries(vocabData as Record<string, unknown>)) {
        if (Array.isArray(arr) && arr.length >= 1) {
          /* v8 ignore next 4 */
          state.vocab[id] = {
            level: Number(arr[0] ?? 1),
            lastReviewed: Number(arr[1] ?? 0) * 1000,
          };
        }
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
export function mergeStates(local: LocalState, imported: LocalState): LocalState {
  const merged: LocalState = {
    chapters: [],
    srs: {},
    vocab: {},
  };

  // Merge unlocked chapters (Union), filtering legacy numeric progress
  const allChapters = [
    ...local.chapters,
    ...imported.chapters,
  ].filter((c) => typeof c === "string");

  merged.chapters = [...new Set(allChapters)].sort();

  // Merge helper for key-value stores (latest timestamp wins)
  const mergeStore = (localStore: SrsStateMap, importedStore: SrsStateMap): SrsStateMap => {
    const mergedStore: SrsStateMap = {};
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
        const item = importedItem || localItem;
        mergedStore[id] = item!;
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
export function saveLocalState(state: LocalState): boolean {
  if (typeof window !== "undefined") {
    try {
      const chSuccess = saveUnlockedChapters(state.chapters);
      const srsSuccess = savePhraseSRS(state.srs);
      const vocabSuccess = saveVocabSRS(state.vocab);

      if (!chSuccess || !srsSuccess || !vocabSuccess) {
        throw new Error("One or more storage saves failed");
      }
      return true;
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
      return false;
    }
  }
  return false;
}
