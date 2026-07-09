import { selectCards, gradeCard, type IdentifiableItem } from "./srs-engine.js";
import type { SrsStateMap } from "../types/index.js";

export interface SessionConfig<T> {
  poolItems: T[];
  srsState: SrsStateMap;
  limit?: number;
}

export class PracticeSession<T extends IdentifiableItem> {
  readonly cards: T[];
  private currentIndex = 0;
  private correctCount = 0;
  private srsState: SrsStateMap;

  constructor(config: SessionConfig<T>) {
    this.srsState = { ...config.srsState };
    this.cards = selectCards(
      config.poolItems,
      this.srsState,
      config.limit ?? 10,
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
    updatedCardState: any;
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
}
