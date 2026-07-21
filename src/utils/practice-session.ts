import { selectCards, gradeCard, type IdentifiableItem } from "./srs-engine.js";
import type { SrsStateMap, SrsCardState } from "../types/index.js";

export interface SessionConfig<T> {
  poolItems: T[];
  srsState: SrsStateMap;
  limit?: number;
  randomizer?: () => number;
}

export class PracticeSession<T extends IdentifiableItem> {
  readonly cards: T[];
  private currentIndex = 0;
  private correctCount = 0;
  private srsState: SrsStateMap;
  private randomizer: () => number;

  constructor(config: SessionConfig<T>) {
    this.srsState = { ...config.srsState };
    this.randomizer = config.randomizer ?? Math.random;
    this.cards = selectCards(
      config.poolItems,
      this.srsState,
      config.limit ?? 10,
      this.randomizer,
    );
  }

  getCurrentCard(): T | undefined {
    return this.cards[this.currentIndex];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getCorrectCount(): number {
    return this.correctCount;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.cards.length;
    return {
      current: this.currentIndex + 1,
      total,
      percentage: total > 0 ? (this.currentIndex / total) * 100 : 0,
    };
  }

  isFinished(): boolean {
    return this.currentIndex >= this.cards.length;
  }

  submitResponse(isCorrect: boolean): {
    updatedCardState: SrsCardState | null;
    nextCard: T | undefined;
    isFinished: boolean;
  } {
    const card = this.getCurrentCard();
    if (!card) {
      return { updatedCardState: null, nextCard: undefined, isFinished: true };
    }

    const currentCardState = this.srsState[card.id];
    const updatedCardState = gradeCard(currentCardState, isCorrect);
    this.srsState[card.id] = updatedCardState;

    if (isCorrect) {
      this.correctCount++;
    }

    this.currentIndex++;
    const nextCard = this.getCurrentCard();
    const finished = this.isFinished();

    return {
      updatedCardState,
      nextCard,
      isFinished: finished,
    };
  }

  getUpdatedSrsState(): SrsStateMap {
    return this.srsState;
  }

  getResults() {
    const total = this.cards.length;
    return {
      correct: this.correctCount,
      total,
      percentage: total > 0 ? (this.correctCount / total) * 100 : 0,
      srsState: this.srsState,
    };
  }

  getShuffledIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(this.randomizer() * (i + 1));
      const temp = indices[i]!;
      indices[i] = indices[j]!;
      indices[j] = temp;
    }
    return indices;
  }
}
