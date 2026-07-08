/**
 * Spaced Repetition System (SRS) Learning Engine.
 * Manages item selection based on review levels and grades progress up/down.
 */

/**
 * Selects up to `limit` items from a pool using weighted SRS selection.
 * Lower level items are weighted more heavily so they appear more frequently.
 *
 * @param {Array<object>} poolItems Items available for review (e.g. phrases or vocab)
 * @param {object} srsState Map of item IDs to their { level, lastReviewed } states
 * @param {number} limit Maximum number of items to select for the session
 * @returns {Array<object>} Selected items
 */
export function selectCards(poolItems, srsState, limit = 10) {
  if (!poolItems || poolItems.length === 0) return [];

  const weightedPool = poolItems.map((item) => {
    const state = srsState[item.id];
    const lvl = state ? state.level : 1;
    // Lower level = higher weight
    const weight = 1 / Math.pow(lvl, 1.5);
    return { item, weight };
  });

  const selectedCards = [];
  const count = Math.min(limit, poolItems.length);
  const tempPool = [...weightedPool];

  for (let i = 0; i < count; i++) {
    const totalWeight = tempPool.reduce((sum, el) => sum + el.weight, 0);
    if (totalWeight <= 0) break;

    let r = Math.random() * totalWeight;
    let cumulative = 0;
    let selectedIndex = -1;

    for (let j = 0; j < tempPool.length; j++) {
      cumulative += tempPool[j].weight;
      if (r <= cumulative) {
        selectedIndex = j;
        break;
      }
    }

    if (selectedIndex !== -1) {
      selectedCards.push(tempPool[selectedIndex].item);
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
 * @param {object} currentState The current level state (e.g. { level, lastReviewed })
 * @param {boolean} isCorrect Whether the user answered correctly
 * @returns {object} The updated state: { level, lastReviewed }
 */
export function gradeCard(currentState, isCorrect) {
  const level = currentState ? currentState.level : 1;
  let newLevel;

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
