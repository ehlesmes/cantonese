import crypto from "node:crypto";
import { getCleanSpokenText } from "./text.js";

/**
 * Generates a SHA-256 hash matching client-side Web Crypto and slices it to 16 characters.
 */
export function getAudioHash(text: string | null | undefined): string {
  const clean = getCleanSpokenText(text);
  return crypto.createHash("sha256").update(clean).digest("hex").slice(0, 16);
}
