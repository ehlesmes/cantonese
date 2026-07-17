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
 * Cleans data for incomplete chapters (orphaned records) and ensures all items for unlocked chapters are present.
 * Purely returns a new UserProgress state and the counts of modified records.
 */
export function cleanIncompleteProgressState(
  state: UserProgress,
  allChapters: Array<{ id: string; phrases: string[]; vocab: string[] }>,
): {
  newState: UserProgress;
  cleanedPhrasesCount: number;
  cleanedVocabCount: number;
  addedPhrasesCount: number;
  addedVocabCount: number;
} {
  let cleanedPhrasesCount = 0;
  let cleanedVocabCount = 0;
  let addedPhrasesCount = 0;
  let addedVocabCount = 0;
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
    } else {
      chapter.phrases.forEach((pid) => {
        if (!newPhraseSrs[pid]) {
          newPhraseSrs[pid] = { level: 0, lastReviewed: 0 };
          addedPhrasesCount++;
        }
      });
      chapter.vocab.forEach((vid) => {
        if (!newVocabSrs[vid]) {
          newVocabSrs[vid] = { level: 0, lastReviewed: 0 };
          addedVocabCount++;
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
    addedPhrasesCount,
    addedVocabCount,
  };
}
