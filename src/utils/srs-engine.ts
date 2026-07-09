import type { SrsCardState, SrsStateMap } from "../types";

export interface IdentifiableItem {
  id: string;
}

/**
 * Selects up to `limit` items from a pool using weighted SRS selection.
 * Lower level items are weighted more heavily so they appear more frequently.
 *
 * @param poolItems Items available for review (e.g. phrases or vocab)
 * @param srsState Map of item IDs to their { level, lastReviewed } states
 * @param limit Maximum number of items to select for the session
 * @returns Selected items
 */
export function selectCards<T extends IdentifiableItem>(
  poolItems: T[],
  srsState: SrsStateMap,
  limit: number = 10
): T[] {
  if (!poolItems || poolItems.length === 0) return [];

  const weightedPool = poolItems.map((item) => {
    const state = srsState[item.id];
    const lvl = (state && typeof state.level === "number") ? state.level : 1;
    // Lower level = higher weight
    const weight = 1 / Math.pow(lvl, 1.5);
    return { item, weight };
  });

  const selectedCards: T[] = [];
  const count = Math.min(limit, poolItems.length);
  const tempPool = [...weightedPool];

  for (let i = 0; i < count; i++) {
    const totalWeight = tempPool.reduce((sum, el) => sum + el.weight, 0);
    if (totalWeight <= 0) break;

    let r = Math.random() * totalWeight;
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
 * @param currentState The current level state (e.g. { level, lastReviewed })
 * @param isCorrect Whether the user answered correctly
 * @returns The updated state: { level, lastReviewed }
 */
export function gradeCard(
  currentState: SrsCardState | undefined,
  isCorrect: boolean
): SrsCardState {
  const level = (currentState && typeof currentState.level === "number") ? currentState.level : 1;
  let newLevel: number;

  if (isCorrect) {
    newLevel = Math.min(level + 1, 5);
  } else {
    newLevel = Math.max(level - 2, 1);
  }

  return {
    level: newLevel,
    lastReviewed: Date.now(),
  };
}
