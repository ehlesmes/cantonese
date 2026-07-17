import type { UserProgress } from "../types/index.js";

/**
 * Removes progress for a single chapter.
 * Purely returns a new UserProgress state.
 */
export function removeChapterProgressState(
  state: UserProgress,
  chapterId: string,
  chapterData: { phrases: string[]; vocab: string[] },
): UserProgress {
  const newPhraseSrs = { ...state.phraseSrs };
  const newVocabSrs = { ...state.vocabSrs };

  chapterData.phrases.forEach((pid) => {
    delete newPhraseSrs[pid];
  });
  chapterData.vocab.forEach((vid) => {
    delete newVocabSrs[vid];
  });

  return {
    unlockedChapters: state.unlockedChapters.filter((id) => id !== chapterId),
    phraseSrs: newPhraseSrs,
    vocabSrs: newVocabSrs,
  };
}

/**
 * Cleans data for incomplete chapters (orphaned records).
 * Purely returns a new UserProgress state and the count of cleaned records.
 */
export function cleanIncompleteProgressState(
  state: UserProgress,
  allChapters: Array<{ id: string; phrases: string[]; vocab: string[] }>,
): {
  newState: UserProgress;
  cleanedPhrasesCount: number;
  cleanedVocabCount: number;
} {
  let cleanedPhrasesCount = 0;
  let cleanedVocabCount = 0;
  const newPhraseSrs = { ...state.phraseSrs };
  const newVocabSrs = { ...state.vocabSrs };

  const allValidPhraseIds = new Set(allChapters.flatMap((ch) => ch.phrases));
  const allValidVocabIds = new Set(allChapters.flatMap((ch) => ch.vocab));

  Object.keys(newPhraseSrs).forEach((pid) => {
    if (!allValidPhraseIds.has(pid)) {
      delete newPhraseSrs[pid];
      cleanedPhrasesCount++;
    }
  });

  Object.keys(newVocabSrs).forEach((vid) => {
    if (!allValidVocabIds.has(vid)) {
      delete newVocabSrs[vid];
      cleanedVocabCount++;
    }
  });

  allChapters.forEach((chapter) => {
    if (!state.unlockedChapters.includes(chapter.id)) {
      chapter.phrases.forEach((pid) => {
        if (newPhraseSrs[pid]) {
          delete newPhraseSrs[pid];
          cleanedPhrasesCount++;
        }
      });
      chapter.vocab.forEach((vid) => {
        if (newVocabSrs[vid]) {
          delete newVocabSrs[vid];
          cleanedVocabCount++;
        }
      });
    }
  });

  return {
    newState: {
      unlockedChapters: state.unlockedChapters,
      phraseSrs: newPhraseSrs,
      vocabSrs: newVocabSrs,
    },
    cleanedPhrasesCount,
    cleanedVocabCount,
  };
}
