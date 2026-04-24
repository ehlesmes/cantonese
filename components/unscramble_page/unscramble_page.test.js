import { describe, it, expect, beforeEach } from "vitest";
import "./unscramble_page.js";

describe("UnscramblePage Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("unscramble-page");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("unscramble-page")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should propagate tokens to the unscramble-exercise and enable footer on complete", () => {
    const tokens = [["你", "nei5"], ["好", "hou2"]];
    element.setAttribute("tokens", JSON.stringify(tokens));
    
    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    expect(exercise.getAttribute("tokens")).toBe(JSON.stringify(tokens));
    expect(footer.getAttribute("primary-disabled")).toBe("true");

    // Complete the exercise correctly
    // We'll call the internal method on exercise because triggering real clicks is slow here
    exercise.moveToSlots(0);
    exercise.moveToSlots(0);
    
    // Page should update footer
    expect(footer.getAttribute("primary-disabled")).toBe("false");
  });

  it("should dispatch unscramble-result when primary button is clicked after completion", () => {
    const tokens = [["你", "nei5"]];
    element.setAttribute("tokens", JSON.stringify(tokens));
    const exercise = element.shadowRoot.getElementById("exercise");
    const footer = element.shadowRoot.getElementById("footer");

    const resultSpy = vi.fn();
    element.addEventListener("unscramble-result", resultSpy);

    // Complete correctly
    exercise.moveToSlots(0);

    // Click continue
    footer.dispatchEvent(new CustomEvent("primary-click", { bubbles: true, composed: true }));

    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);
  });
});
