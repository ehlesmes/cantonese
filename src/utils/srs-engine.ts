import type { SrsCardState, SrsStateMap, PracticeItemBase } from "../types";

export interface IdentifiableItem {
  id: string;
}

/**
 * Selects up to `limit` items from a pool using weighted SRS selection.
 * Lower level items are weighted more heavily so they appear more frequently.
 *
 * @param poolItems Items available for review (e.g. phrases or vocab)
 * @param limit Maximum number of items to select for the session
 * @returns Selected items
 */
export function selectCards<T extends IdentifiableItem>(
  poolItems: T[],
  srsState: SrsStateMap,
  limit: number = 10,
  randomizer: () => number = Math.random,
): T[] {
  if (!poolItems || poolItems.length === 0) return [];

  const weightedPool = poolItems.map((item) => {
    const state = srsState[item.id];
    const lvl = state && typeof state.level === "number" ? state.level : 1;
    // Lower level = higher weight (Base 3 exponential decay)
    const weight = 1 / Math.pow(3, lvl - 1);
    return { item, weight };
  });

  const selectedCards: T[] = [];
  const count = Math.min(limit, poolItems.length);
  const tempPool = [...weightedPool];

  for (let i = 0; i < count; i++) {
    const totalWeight = tempPool.reduce((sum, el) => sum + el.weight, 0);
    if (totalWeight <= 0) break;

    const r = randomizer() * totalWeight;
    let cumulative = 0;
    let selectedIndex = -1;

    for (let j = 0; j < tempPool.length; j++) {
      const element = tempPool[j]!;
      cumulative += element.weight;
      if (r <= cumulative) {
        selectedIndex = j;
        break;
      }
    }

    if (selectedIndex !== -1) {
      const selected = tempPool[selectedIndex]!;
      selectedCards.push(selected.item);
      tempPool.splice(selectedIndex, 1);
    }
  }

  return selectedCards;
}

/**
 * Grades an item response and updates its SRS level.
 * Correct answers level up (+1, max 5).
 * Incorrect answers level down (-2, min 1).
 *
 * @param currentState The current level state (e.g. { level })
 * @param isCorrect Whether the user answered correctly
 * @returns The updated state: { level }
 */
export function gradeCard(
  currentState: SrsCardState | undefined,
  isCorrect: boolean,
): SrsCardState {
  const level =
    currentState && typeof currentState.level === "number"
      ? currentState.level
      : 1;
  let newLevel: number;

  if (isCorrect) {
    newLevel = Math.min(level + 1, 7);
  } else {
    newLevel = Math.max(level - 1, 1);
  }

  return {
    level: newLevel,
  };
}

/**
 * Filters a pool of practice items based on SRS level or chapter constraints.
 */
export function filterPracticeItems<T extends PracticeItemBase>(
  poolItems: T[],
  unlockedChapters: string[],
  srsState: SrsStateMap,
  options?: { chapterId?: string | null; srsLevel?: number | string | null },
): T[] {
  const { chapterId, srsLevel } = options || {};
  if (typeof chapterId === "string" && chapterId) {
    return poolItems.filter((item) => item.chapter === chapterId);
  } else if (
    srsLevel !== undefined &&
    srsLevel !== null &&
    !Number.isNaN(Number(srsLevel))
  ) {
    return poolItems.filter((item) => {
      const lvl = srsState[item.id]?.level ?? 1;
      return lvl === Number(srsLevel);
    });
  } else {
    return poolItems.filter((item) => unlockedChapters.includes(item.chapter));
  }
}

export interface GroupedByChapter<T> {
  title: string;
  chapterNumber: number;
  items: T[];
}

/**
 * Groups practice items for directory rendering by either chapter or SRS level.
 */
export function groupItemsForDirectory<T extends PracticeItemBase>(
  poolItems: T[],
  srsState: SrsStateMap,
  mode: "chapter" | "level",
) {
  if (mode === "chapter") {
    const grouped: Record<string, GroupedByChapter<T>> = {};
    poolItems.forEach((item) => {
      let group = grouped[item.chapter];
      if (!group) {
        group = {
          title: item.chapterTitle,
          chapterNumber: item.chapterNumber,
          items: [],
        };
        grouped[item.chapter] = group;
      }
      group.items.push(item);
    });
    const sortedChapterIds = Object.keys(grouped).sort(
      (a, b) => grouped[a]!.chapterNumber - grouped[b]!.chapterNumber,
    );
    return { type: "chapter" as const, grouped, sortedChapterIds };
  } else {
    const grouped: Record<number, T[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };
    poolItems.forEach((item) => {
      const lvl = srsState[item.id]?.level ?? 1;
      if (grouped[lvl]) {
        grouped[lvl].push(item);
      }
    });
    return { type: "level" as const, grouped };
  }
}

/**
 * Generates an array of indices from 0 to length - 1, shuffled using Fisher-Yates.
 */
export function getShuffledIndices(
  length: number,
  randomizer: () => number = Math.random,
): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(randomizer() * (i + 1));
    const temp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = temp;
  }
  return indices;
}

/**
 * Filters a pool of items to only include those belonging to unlocked chapters.
 */
export function filterByUnlockedChapters<T extends PracticeItemBase>(
  poolItems: T[],
  unlockedChapters: string[],
): T[] {
  return poolItems.filter((item) => unlockedChapters.includes(item.chapter));
}

/**
 * Counts the number of items in the pool that have reached the mastered level (level 5).
 */
export function countMasteredItems<T extends IdentifiableItem>(
  poolItems: T[],
  srsState: SrsStateMap,
): number {
  let count = 0;
  for (const item of poolItems) {
    if (srsState[item.id]?.level === 7) {
      count++;
    }
  }
  return count;
}
