import { describe, test, expect, vi } from "vitest";
import { selectCards, gradeCard } from "../src/utils/srs-engine.js";

function splitCantoneseTokens(cantoneseRaw: string) {
  if (!cantoneseRaw) return [];
  const regex = /([^\s[]+\[[^\]]+\]|[^\s[]+)/g;
  return cantoneseRaw.match(regex) || [];
}

// Test the core space-separated splitting behavior
describe("Review Board Space Split Utility", () => {
  test("split raw Cantonese text by whitespace and isolate punctuation", () => {
    const raw =
      "我[ngo5|I / me] 係[hai6|to be (am/is/are) / yes] 香港[hoeng1gong2|Hong Kong] 人[jan4|person / people / human]。";
    const tokens = splitCantoneseTokens(raw);

    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toBe("我[ngo5|I / me]");
    expect(tokens[1]).toBe("係[hai6|to be (am/is/are) / yes]");
    expect(tokens[2]).toBe("香港[hoeng1gong2|Hong Kong]");
    expect(tokens[3]).toBe("人[jan4|person / people / human]");
    expect(tokens[4]).toBe("。");
  });

  test("dialogue turn parser extracts tokens correctly", () => {
    const dialogueLine =
      "你[nei5|you] 好[hou2|good / well] 嗎[maa1|sentence-final particle for yes/no questions]？";
    const tokens = splitCantoneseTokens(dialogueLine);

    expect(tokens).toHaveLength(4);
    expect(tokens[0]).toBe("你[nei5|you]");
    expect(tokens[1]).toBe("好[hou2|good / well]");
    expect(tokens[2]).toBe(
      "嗎[maa1|sentence-final particle for yes/no questions]",
    );
    expect(tokens[3]).toBe("？");
  });
});

// Test the Spaced Repetition (SRS) Engine imported production functions
describe("Spaced Repetition System (SRS) Engine Spec", () => {
  test("gradeCard should increment level up to maximum of 5 on correct answers", () => {
    const state1 = { level: 1, lastReviewed: 0 };
    const graded1 = gradeCard(state1, true);
    expect(graded1.level).toBe(2);
    expect(graded1.lastReviewed).toBeGreaterThan(0);

    const state5 = { level: 5, lastReviewed: 0 };
    const graded5 = gradeCard(state5, true);
    expect(graded5.level).toBe(5); // caps at 5
  });

  test("gradeCard should decrement level by 2 down to minimum of 1 on incorrect answers", () => {
    const state4 = { level: 4, lastReviewed: 0 };
    const graded4 = gradeCard(state4, false);
    expect(graded4.level).toBe(2);

    const state2 = { level: 2, lastReviewed: 0 };
    const graded2 = gradeCard(state2, false);
    expect(graded2.level).toBe(1); // floor is 1
  });

  test("gradeCard should handle undefined/null initial state gracefully", () => {
    // @ts-expect-error Testing gracefully handles null
    const graded = gradeCard(null, true);
    expect(graded.level).toBe(2); // starts at level 1, increments to 2
  });

  test("selectCards should choose up to limit cards from available pool", () => {
    const pool = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
    const srsState = {};
    const selected = selectCards(pool, srsState, 2);
    expect(selected).toHaveLength(2);
  });

  test("selectCards should handle empty or undefined pools gracefully", () => {
    expect(selectCards([], {})).toEqual([]);
    // @ts-expect-error Testing gracefully handles null
    expect(selectCards(null, {})).toEqual([]);
  });

  test("selectCards weighting should prioritize lower-level items", () => {
    // Set up a large simulation to verify lower-level items are selected more frequently
    const pool = [{ id: "easy" }, { id: "hard" }];
    // easy card is level 5 (low weight), hard card is level 1 (high weight)
    const srsState = {
      easy: { level: 5, lastReviewed: 0 },
      hard: { level: 1, lastReviewed: 0 },
    };

    let hardCount = 0;
    let easyCount = 0;

    for (let i = 0; i < 1000; i++) {
      const selected = selectCards(pool, srsState, 1);
      if (selected[0]?.id === "hard") {
        hardCount++;
      } else {
        easyCount++;
      }
    }

    // Level 1 weight is 1.0, Level 5 weight is 1 / 5^1.5 ≈ 0.089.
    // Level 1 should be picked roughly 11x more often than Level 5.
    expect(hardCount).toBeGreaterThan(easyCount * 5);
  });

  test("should handle corrupted cards with zero or invalid weights without looping infinitely", () => {
    const pool = [{ id: "corrupted-1" }, { id: "corrupted-2" }];
    const srsState = {
      "corrupted-1": { level: Infinity, lastReviewed: 0 },
      "corrupted-2": { level: Infinity, lastReviewed: 0 },
    };
    expect(selectCards(pool, srsState, 2)).toEqual([]);
  });

  test("should handle floating-point precision rounding anomalies without throwing TypeErrors", () => {
    const pool = [{ id: "card-1" }];
    const srsState = {}; // default weight = 1.0

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(1.1);

    expect(() => {
      const selected = selectCards(pool, srsState, 1);
      expect(selected).toEqual([]);
    }).not.toThrow();

    randomSpy.mockRestore();
  });
});

export {};
