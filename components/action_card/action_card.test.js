import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActionCard } from "./action_card.js";

describe("ActionCard Component", () => {
  const mockData = {
    title: "Next Lesson",
    description: "Continue where you left off",
    icon: "play_arrow",
    actionText: "Start",
  };

  beforeEach(() => {
    document.body.innerHTML = "";
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

  it("should render the correct icon", () => {
    const card = new ActionCard(mockData);
    expect(card.shadowRoot.querySelector(".card-icon").textContent).toBe(
      mockData.icon,
    );
  });

  it("should dispatch 'action-click' when button is clicked", () => {
    const card = new ActionCard(mockData);
    const handler = vi.fn();
    card.element.addEventListener("action-click", handler);

    // Find the Button component's root element inside the card footer
    const btnEl = card.shadowRoot.querySelector(".card-footer").firstChild;
    btnEl.click();

    expect(handler).toHaveBeenCalled();
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
      expect(() => new ActionCard({})).toThrow("Missing property: title");
    });
  });
});
