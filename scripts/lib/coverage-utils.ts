export interface RefWord {
  char: string;
  rank: number;
  jyutping: string;
  translation: string;
}

export interface Bracket {
  name: string;
  startRank: number;
  endRank: number;
  covered: number;
  total: number;
}

export interface CoverageResults {
  totalCovered: number;
  refCount: number;
  brackets: Bracket[];
  missingWords: RefWord[];
}

export const variantMap: Record<string, string> = {
  啊: "呀",
  畀: "俾",
  比: "俾",
  左: "咗",
  地: "哋",
  重: "仲",
};

/**
 * Evaluates the coverage of a taught vocabulary set against a reference word list.
 */
export function evaluateCoverage(
  refWords: RefWord[],
  taughtChars: Set<string>,
): CoverageResults {
  let totalCovered = 0;
  const brackets: Bracket[] = [
    { name: "Top 100", startRank: 1, endRank: 100, covered: 0, total: 100 },
    { name: "Top 100–300", startRank: 101, endRank: 300, covered: 0, total: 200 },
    { name: "Top 300–500", startRank: 301, endRank: 500, covered: 0, total: 200 },
    {
      name: "Top 500–1000",
      startRank: 501,
      endRank: 1000,
      covered: 0,
      total: 500,
    },
  ];

  const missingWords: RefWord[] = [];

  for (const ref of refWords) {
    let isCovered = taughtChars.has(ref.char);
    if (!isCovered && variantMap[ref.char]) {
      const variant = variantMap[ref.char];
      if (variant !== undefined) {
        isCovered = taughtChars.has(variant);
      }
    }

    if (isCovered) {
      totalCovered++;
      // Add to bracket count
      for (const b of brackets) {
        if (ref.rank >= b.startRank && ref.rank <= b.endRank) {
          b.covered++;
          break;
        }
      }
    } else {
      missingWords.push(ref);
    }
  }

  return {
    totalCovered,
    refCount: refWords.length,
    brackets,
    missingWords,
  };
}
