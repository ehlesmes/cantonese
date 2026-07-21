import { getCleanSpokenText } from "./text.js";

/**
 * Generates a SHA-256 hash matching client-side Web Crypto and slices it to 16 characters.
 */
export async function getAudioHash(
  text: string | null | undefined,
): Promise<string> {
  const clean = getCleanSpokenText(text);
  const msgUint8 = new TextEncoder().encode(clean);

  let subtle: SubtleCrypto;
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    globalThis.crypto.subtle
  ) {
    subtle = globalThis.crypto.subtle;
  } else {
    // Node 18 fallback using dynamic import
    const nodeCrypto = await import("node:crypto");
    subtle = nodeCrypto.webcrypto.subtle as SubtleCrypto;
  }

  const hashBuffer = await subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/**
 * Extracts all annotated tokens from a cantonese string and generates audio hashes for them.
 */
export async function getTokenHashes(
  text: string | null | undefined,
): Promise<Record<string, string>> {
  const tokenHashes: Record<string, string> = {};
  if (!text) return tokenHashes;
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const char = match[1]!;
    tokenHashes[char] = await getAudioHash(char);
  }
  return tokenHashes;
}
