import { describe, test, expect } from "vitest";

function splitCantoneseTokens(cantoneseRaw) {
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

// Test the SRS level weighting calculations
describe("Spaced Repetition (SRS) Weighting", () => {
  function getWeight(level) {
    return 1 / Math.pow(level, 1.5);
  }

  test("calculate level weights correctly", () => {
    expect(getWeight(1)).toBe(1);
    expect(getWeight(2)).toBeCloseTo(0.35355, 4);
    expect(getWeight(3)).toBeCloseTo(0.19245, 4);
    expect(getWeight(4)).toBe(0.125);
    expect(getWeight(5)).toBeCloseTo(0.08944, 4);
  });

  test("weight distribution should prioritize level 1 over level 5", () => {
    const w1 = getWeight(1);
    const w5 = getWeight(5);
    expect(w1).toBeGreaterThan(w5 * 10); // Lvl 1 is more than 10x as likely to be selected as Lvl 5
  });

  // Simulated weighted sampler check
  test("weighted sampler draws items with higher weights more often", () => {
    const items = [
      { id: "item-easy", weight: getWeight(5) }, // Mastered
      { id: "item-hard", weight: getWeight(1) }, // New/Needs practice
    ];

    let hardCount = 0;
    let easyCount = 0;

    // Simulate 1000 draws
    for (let i = 0; i < 1000; i++) {
      const totalWeight = items[0].weight + items[1].weight;
      const r = Math.random() * totalWeight;
      if (r <= items[0].weight) {
        easyCount++;
      } else {
        hardCount++;
      }
    }

    // Since weight(1) is ~11x larger than weight(5), the hard item should be chosen much more often
    expect(hardCount).toBeGreaterThan(easyCount * 5);
  });
});
