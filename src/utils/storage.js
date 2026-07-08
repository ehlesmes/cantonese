/**
 * Client-side Storage Utility for Cantonese Course Progress.
 * Standardizes localStorage keys and operations.
 */

export function getUnlockedChapters() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("cantonese_unlocked_chapters");
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((c) => typeof c === "string")
        : [];
    }
  } catch (e) {
    console.error("Failed to read unlocked chapters:", e);
  }
  return [];
}

export function saveUnlockedChapters(chapters) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(
      "cantonese_unlocked_chapters",
      JSON.stringify(chapters),
    );
    return true;
  } catch (e) {
    console.error("Failed to save unlocked chapters:", e);
    return false;
  }
}

export function getPhraseSRS() {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("cantonese_srs_state");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to read phrase SRS state:", e);
    return {};
  }
}

export function savePhraseSRS(state) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("cantonese_srs_state", JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save phrase SRS state:", e);
    return false;
  }
}

export function getVocabSRS() {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("cantonese_vocab_srs_state");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to read vocab SRS state:", e);
    return {};
  }
}

export function saveVocabSRS(state) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("cantonese_vocab_srs_state", JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save vocab SRS state:", e);
    return false;
  }
}

export function clearAllProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cantonese_unlocked_chapters");
  localStorage.removeItem("cantonese_srs_state");
  localStorage.removeItem("cantonese_vocab_srs_state");
}
