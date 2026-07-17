import { describe, test, expect } from "vitest";
import { PracticeSession } from "./practice-session.js";
import type { SrsStateMap } from "../types/index.js";

describe("PracticeSession state engine", () => {
  const pool = [
    { id: "card1", content: "Card 1" },
    { id: "card2", content: "Card 2" },
    { id: "card3", content: "Card 3" },
  ];

  test("initializes cards from pool on instantiation", () => {
    const srsState: SrsStateMap = {};
    const session = new PracticeSession({
      poolItems: pool,
      srsState,
      limit: 2,
    });

    expect(session.cards.length).toBe(2);
    expect(session.getCurrentIndex()).toBe(0);
    expect(session.getCorrectCount()).toBe(0);
    expect(session.isFinished()).toBe(false);

    const firstCard = session.getCurrentCard();
    expect(firstCard).toBeDefined();
    expect(pool.some((p) => p.id === firstCard?.id)).toBe(true);
  });

  test("progresses indices and updates scores correctly on submitResponse", () => {
    const srsState: SrsStateMap = {
      card1: { level: 1, lastReviewed: 0 },
      card2: { level: 2, lastReviewed: 0 },
    };
    const session = new PracticeSession({
      poolItems: pool.slice(0, 2),
      srsState,
      limit: 2,
    });

    // Verify first card
    const cardA = session.getCurrentCard()!;
    const progressA = session.getProgress();
    expect(progressA.current).toBe(1);
    expect(progressA.percentage).toBe(0);

    // Answer first card correctly
    const resA = session.submitResponse(true);
    expect(session.getCorrectCount()).toBe(1);
    expect(session.getCurrentIndex()).toBe(1);
    expect(resA.updatedCardState.level).toBe(srsState[cardA.id]!.level + 1);

    // Verify second card
    const cardB = session.getCurrentCard()!;
    const progressB = session.getProgress();
    expect(progressB.current).toBe(2);
    expect(progressB.percentage).toBe(50);

    // Answer second card incorrectly
    const resB = session.submitResponse(false);
    expect(session.getCorrectCount()).toBe(1);
    expect(session.getCurrentIndex()).toBe(2);
    expect(resB.isFinished).toBe(true);
    expect(session.isFinished()).toBe(true);

    const results = session.getResults();
    expect(results.correct).toBe(1);
    expect(results.total).toBe(2);
    expect(results.percentage).toBe(50);

    const finalSrs = session.getUpdatedSrsState();
    expect(finalSrs[cardA.id]!.level).toBe(srsState[cardA.id]!.level + 1);
    expect(finalSrs[cardB.id]!.level).toBe(
      Math.max(srsState[cardB.id]!.level - 2, 1),
    );
  });

  test("handles empty pool gracefully", () => {
    const session = new PracticeSession({
      poolItems: [],
      srsState: {},
    });
    expect(session.cards.length).toBe(0);
    expect(session.isFinished()).toBe(true);
    expect(session.getCurrentCard()).toBeUndefined();
    expect(session.getProgress().percentage).toBe(0);

    const result = session.submitResponse(true);
    expect(result.updatedCardState).toBeNull();
    expect(result.nextCard).toBeUndefined();
    expect(result.isFinished).toBe(true);

    const results = session.getResults();
    expect(results.correct).toBe(0);
    expect(results.total).toBe(0);
    expect(results.percentage).toBe(0);
  });
});
