import type { SrsStateMap } from "../types";

export function getUnlockedChapters(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("cantonese_unlocked_chapters");
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      return Array.isArray(parsed)
        ? (parsed as unknown[]).filter((c): c is string => typeof c === "string")
        : [];
    }
  } catch (e) {
    console.error("Failed to read unlocked chapters:", e);
  }
  return [];
}

export function saveUnlockedChapters(chapters: string[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(chapters)
    );
    return true;
  } catch (e) {
    console.error("Failed to save unlocked chapters:", e);
    return false;
  }
}

export function getPhraseSRS(): SrsStateMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("cantonese_srs_state");
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as SrsStateMap;
      }
    }
  } catch (e) {
    console.error("Failed to read phrase SRS state:", e);
  }
  return {};
}

export function savePhraseSRS(state: SrsStateMap): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("cantonese_srs_state", JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save phrase SRS state:", e);
    return false;
  }
}

export function getVocabSRS(): SrsStateMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("cantonese_vocab_srs_state");
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as SrsStateMap;
      }
    }
  } catch (e) {
    console.error("Failed to read vocab SRS state:", e);
  }
  return {};
}

export function saveVocabSRS(state: SrsStateMap): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("cantonese_vocab_srs_state", JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save vocab SRS state:", e);
    return false;
  }
}

export function clearAllProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cantonese_unlocked_chapters");
  localStorage.removeItem("cantonese_srs_state");
  localStorage.removeItem("cantonese_vocab_srs_state");
}
