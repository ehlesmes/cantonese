import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActionCard } from "./action_card.js";

describe("ActionCard Component", () => {
  const mockData = {
    id: "test-card",
    title: "Next Lesson",
    description: "Continue where you left off",
  };

  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("should render title and description", () => {
    const card = new ActionCard(mockData);
    expect(card.shadowRoot.querySelector(".card-title").textContent).toBe(
      mockData.title,
    );
    expect(card.shadowRoot.querySelector(".card-description").textContent).toBe(
      mockData.description,
    );
  });

  it("should dispatch 'action-click' when card is clicked", () => {
    const card = new ActionCard(mockData);
    const handler = vi.fn();
    card.element.addEventListener("action-click", handler);

    const cardDiv = card.shadowRoot.querySelector(".action-card");
    cardDiv.click();

    expect(handler).toHaveBeenCalled();
  });

  describe("Validation", () => {
    it("should throw error if required properties are missing", () => {
      expect(() => new ActionCard({ id: "id" })).toThrow(
        "Missing property: title",
      );
    });
  });
});
