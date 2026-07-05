import { describe, test, expect } from "vitest";

// Ported ID generator logic to match advanced.astro
function getStablePhraseId(text) {
  const clean = text
    .replace(
      /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g,
      "$1",
    )
    .replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9]/g, "");
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 33) ^ clean.charCodeAt(i);
  }
  const hashStr = (hash >>> 0).toString(36);
  return `phr-${clean.length}-${hashStr}`;
}

// Pure function simulation of removeChapterProgress
function removeChapterProgressPure(
  chapterId,
  currentUnlocked,
  phraseSRS,
  vocabSRS,
  allChaptersData,
) {
  const updatedUnlocked = currentUnlocked.filter((id) => id !== chapterId);
  const updatedPhraseSRS = { ...phraseSRS };
  const updatedVocabSRS = { ...vocabSRS };

  const chapter = allChaptersData.find((ch) => ch.id === chapterId);
  if (chapter) {
    chapter.phrases.forEach((pid) => {
      delete updatedPhraseSRS[pid];
    });
    chapter.vocab.forEach((vid) => {
      delete updatedVocabSRS[vid];
    });
  }
  return {
    unlocked: updatedUnlocked,
    phraseSRS: updatedPhraseSRS,
    vocabSRS: updatedVocabSRS,
  };
}

// Pure function simulation of cleanIncompleteData
function cleanIncompleteDataPure(
  currentUnlocked,
  phraseSRS,
  vocabSRS,
  allChaptersData,
) {
  const updatedPhraseSRS = { ...phraseSRS };
  const updatedVocabSRS = { ...vocabSRS };
  let cleanedPhrases = 0;
  let cleanedVocab = 0;

  allChaptersData.forEach((chapter) => {
    if (!currentUnlocked.includes(chapter.id)) {
      chapter.phrases.forEach((pid) => {
        if (updatedPhraseSRS[pid]) {
          delete updatedPhraseSRS[pid];
          cleanedPhrases++;
        }
      });
      chapter.vocab.forEach((vid) => {
        if (updatedVocabSRS[vid]) {
          delete updatedVocabSRS[vid];
          cleanedVocab++;
        }
      });
    }
  });

  return {
    phraseSRS: updatedPhraseSRS,
    vocabSRS: updatedVocabSRS,
    cleanedPhrases,
    cleanedVocab,
  };
}

describe("Advanced Settings Page Helper Spec", () => {
  const mockChaptersData = [
    {
      id: "tones",
      title: "Tone Mastery & Sounds",
      number: 0,
      phrases: ["phr-1", "phr-2"],
      vocab: ["vocab-1", "vocab-2"],
    },
    {
      id: "greetings",
      title: "Greetings",
      number: 1,
      phrases: ["phr-3", "phr-4"],
      vocab: ["vocab-3", "vocab-4"],
    },
    {
      id: "shopping",
      title: "Shopping",
      number: 2,
      phrases: ["phr-5"],
      vocab: ["vocab-5"],
    },
  ];

  test("getStablePhraseId generates correct and stable IDs", () => {
    const text1 = "你好[nei5 hou2|hello]！";
    const text2 = "你好[nei5 hou2|hello]";

    const id1 = getStablePhraseId(text1);
    const id2 = getStablePhraseId(text2);

    expect(id1).toBe(id2);
    expect(id1.startsWith("phr-")).toBe(true);
  });

  test("removeChapterProgressPure correctly removes chapter from completed and scrubs its SRS states", () => {
    const initialUnlocked = ["tones", "greetings"];
    const initialPhraseSRS = {
      "phr-1": { level: 3 },
      "phr-3": { level: 2 },
      "phr-5": { level: 1 },
    };
    const initialVocabSRS = {
      "vocab-1": { level: 4 },
      "vocab-3": { level: 2 },
    };

    const result = removeChapterProgressPure(
      "greetings",
      initialUnlocked,
      initialPhraseSRS,
      initialVocabSRS,
      mockChaptersData,
    );

    expect(result.unlocked).toEqual(["tones"]);

    // Tones SRS is preserved
    expect(result.phraseSRS["phr-1"]).toBeDefined();
    expect(result.vocabSRS["vocab-1"]).toBeDefined();

    // Greetings SRS is deleted
    expect(result.phraseSRS["phr-3"]).toBeUndefined();
    expect(result.vocabSRS["vocab-3"]).toBeUndefined();

    // Shopping SRS is untouched
    expect(result.phraseSRS["phr-5"]).toBeDefined();
  });

  test("cleanIncompleteDataPure correctly scrubs SRS states of non-completed chapters", () => {
    const initialUnlocked = ["tones"]; // Only tones is completed, greetings is incomplete
    const initialPhraseSRS = {
      "phr-1": { level: 3 },
      "phr-3": { level: 2 },
      "phr-5": { level: 1 },
    };
    const initialVocabSRS = {
      "vocab-1": { level: 4 },
      "vocab-3": { level: 2 },
    };

    const result = cleanIncompleteDataPure(
      initialUnlocked,
      initialPhraseSRS,
      initialVocabSRS,
      mockChaptersData,
    );

    // Tones SRS (completed) is preserved
    expect(result.phraseSRS["phr-1"]).toBeDefined();
    expect(result.vocabSRS["vocab-1"]).toBeDefined();

    // Greetings SRS (incomplete) is deleted
    expect(result.phraseSRS["phr-3"]).toBeUndefined();
    expect(result.vocabSRS["vocab-3"]).toBeUndefined();

    // Shopping SRS (incomplete) is deleted
    expect(result.phraseSRS["phr-5"]).toBeUndefined();

    expect(result.cleanedPhrases).toBe(2); // phr-3 and phr-5
    expect(result.cleanedVocab).toBe(1); // vocab-3
  });
});
