import type { SrsStateMap, CompactSyncPayload } from "../types";
import type { LocalState } from "../client/sys/storage.js";

// Shorthand mapper keys to keep URL/QR payloads compact
const SHORT_KEYS = {
  chapters: "c" as const,
  srs: "s" as const,
  vocab: "v" as const,
  timestamp: "t" as const,
};

/**
 * Fallback to encode a Uint8Array to a URL-safe Base64 string (no padding).
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Fallback to decode a URL-safe Base64 string into a Uint8Array.
 */
export function base64UrlToBytes(str: string): Uint8Array {
  let cleanStr = str.replace(/-/g, "+").replace(/_/g, "/");
  while (cleanStr.length % 4) {
    cleanStr += "=";
  }
  const binary = atob(cleanStr);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface ExtendedUint8Array extends Uint8Array {
  toBase64?(options?: { alphabet?: string; omitPadding?: boolean }): string;
}

interface ExtendedUint8ArrayConstructor {
  fromBase64?(
    str: string,
    options?: { alphabet?: string; lastChunkHandling?: string },
  ): Uint8Array;
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
      new CompressionStream("deflate") as unknown as TransformStream<
        Uint8Array,
        Uint8Array
      >,
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
      new DecompressionStream("deflate") as unknown as TransformStream<
        Uint8Array,
        Uint8Array
      >,
    );
    const buffer = await new Response(decompressedStream).arrayBuffer();
    return new TextDecoder().decode(buffer);
  }
  throw new Error("DecompressionStream is not supported by this browser");
}

function compactSrsMap(
  srsMap: SrsStateMap | undefined,
): Record<string, [number, number]> {
  const compacted: Record<string, [number, number]> = {};
  const keys = Object.keys(srsMap || {});
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i]!;
    const item = srsMap![id];
    if (typeof item?.level === "number") {
      compacted[id] = [
        item.level,
        item.lastReviewed ? Math.floor(item.lastReviewed / 1000) : 0,
      ];
    }
  }
  return compacted;
}

function decodeBase64UrlBytes(cleanStr: string): Uint8Array {
  const uint8Const = Uint8Array as unknown as ExtendedUint8ArrayConstructor;
  if (typeof uint8Const.fromBase64 === "function") {
    try {
      return uint8Const.fromBase64(cleanStr, {
        alphabet: "base64url",
        lastChunkHandling: "loose",
      });
    } catch {
      // Fallback
    }
  }
  return base64UrlToBytes(cleanStr);
}

/**
 * Compacts and serializes progress state into a URL-safe Base64 string (Gzipped)
 */
export async function serializeState(state: LocalState): Promise<string> {
  const compacted: CompactSyncPayload = {
    [SHORT_KEYS.chapters]: state.chapters,
    [SHORT_KEYS.srs]: compactSrsMap(state.srs),
    [SHORT_KEYS.vocab]: compactSrsMap(state.vocab),
    [SHORT_KEYS.timestamp]: Date.now(),
  };

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
export async function decompressPayload(
  decodedBytes: Uint8Array,
): Promise<string> {
  try {
    return await decompressData(decodedBytes);
  } catch {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(decodedBytes);
    } catch {
      throw new Error("Decompression and decoding failed");
    }
  }
}

export function parseSrsMap(
  rawData: unknown,
  skipLegacyId: boolean = false,
): SrsStateMap {
  const result: SrsStateMap = {};
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    for (const [id, arr] of Object.entries(
      rawData as Record<string, unknown>,
    )) {
      if (skipLegacyId && id.startsWith("ch")) continue;

      if (Array.isArray(arr) && arr.length >= 1) {
        result[id] = {
          level: Number(arr[0] ?? 1),
          lastReviewed: Number(arr[1] ?? 0) * 1000,
        };
      }
    }
  }
  return result;
}

export async function deserializeState(
  serializedStr: string,
): Promise<LocalState | null> {
  if (typeof serializedStr !== "string" || !serializedStr.trim()) {
    return null;
  }

  try {
    const cleanStr = serializedStr
      .trim()
      .replace(/ /g, "+")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const decodedBytes = decodeBase64UrlBytes(cleanStr);
    const rawStr = await decompressPayload(decodedBytes);
    const compacted = JSON.parse(rawStr) as unknown;

    if (
      !compacted ||
      typeof compacted !== "object" ||
      Array.isArray(compacted)
    ) {
      throw new Error("Invalid payload structure");
    }

    const payload = compacted as Record<string, unknown>;
    const rawChapters = payload[SHORT_KEYS.chapters] || [];

    const chapters = Array.isArray(rawChapters)
      ? (rawChapters as unknown[]).filter(
          (c): c is string => typeof c === "string",
        )
      : [];

    return {
      chapters,
      srs: parseSrsMap(payload[SHORT_KEYS.srs], true),
      vocab: parseSrsMap(payload[SHORT_KEYS.vocab], false),
      timestamp:
        typeof payload[SHORT_KEYS.timestamp] === "number"
          ? (payload[SHORT_KEYS.timestamp] as number)
          : 0,
    };
  } catch (e) {
    console.error("Failed to deserialize progress state:", e);
    return null;
  }
}

/**
 * Smart-merges imported state with the current local state
 */
export function mergeStates(
  local: LocalState,
  imported: LocalState,
): LocalState {
  const merged: LocalState = {
    chapters: [],
    srs: {},
    vocab: {},
  };

  // Merge unlocked chapters (Union), filtering legacy numeric progress
  const allChapters = [...local.chapters, ...imported.chapters].filter(
    (c) => typeof c === "string",
  );

  merged.chapters = [...new Set(allChapters)].sort();

  // Merge helper for key-value stores (latest timestamp wins)
  const mergeStore = (
    localStore: SrsStateMap,
    importedStore: SrsStateMap,
  ): SrsStateMap => {
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
 * Extracts WebRTC token from a URL if possible, otherwise returns the raw string.
 */
export function extractRTCToken(tokenRaw: string): string {
  try {
    const url = new URL(tokenRaw);
    return url.searchParams.get("rtc") || tokenRaw;
  } catch {
    return tokenRaw;
  }
}

export interface MergeMetrics {
  chapters: { local: number; merged: number };
  phrases: { local: number; merged: number };
  vocab: { local: number; merged: number };
}

/**
 * Calculates local vs merged progress metrics for confirmation UI display.
 */
export function calculateMergeMetrics(
  local: LocalState,
  imported: LocalState,
): MergeMetrics {
  const merged = mergeStates(local, imported);
  const countKeys = (obj: Record<string, unknown> | null | undefined) =>
    Object.keys(obj || {}).length;

  return {
    chapters: { local: local.chapters.length, merged: merged.chapters.length },
    phrases: { local: countKeys(local.srs), merged: countKeys(merged.srs) },
    vocab: { local: countKeys(local.vocab), merged: countKeys(merged.vocab) },
  };
}
