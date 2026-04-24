import { describe, it, expect, beforeEach } from "vitest";
import "./reading_page.js";

describe("ReadingPage Component", () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("reading-page");
    document.body.appendChild(element);
  });

  it("should be defined and upgraded", () => {
    expect(customElements.get("reading-page")).toBeDefined();
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.shadowRoot).not.toBeNull();
  });

  it("should propagate attributes to the reading-exercise component", () => {
    element.setAttribute("cantonese-phrase", "你好");
    element.setAttribute("romanization", "nei5 hou2");
    element.setAttribute("translation", "Hello");

    const exercise = element.shadowRoot.getElementById("exercise");
    expect(exercise.getAttribute("cantonese-phrase")).toBe("你好");
    expect(exercise.getAttribute("romanization")).toBe("nei5 hou2");
    expect(exercise.getAttribute("translation")).toBe("Hello");
  });

  it("should reveal the answer when primary button is clicked in initial state", () => {
    element.setAttribute("translation", "Hello");
    const footer = element.shadowRoot.getElementById("footer");
    const exercise = element.shadowRoot.getElementById("exercise");

    // Initial state
    expect(footer.getAttribute("primary-text")).toBe("Reveal Answer");
    expect(exercise.getAttribute("translation-hidden")).toBe("true");

    // Click reveal
    footer.dispatchEvent(new CustomEvent("primary-click", { bubbles: true, composed: true }));

    // Revealed state
    expect(footer.getAttribute("primary-text")).toBe("Got it right");
    expect(footer.getAttribute("secondary-text")).toBe("Need practice");
    expect(exercise.getAttribute("translation-hidden")).toBe("false");
  });

  it("should dispatch reading-result when clicked in revealed state", () => {
    const footer = element.shadowRoot.getElementById("footer");
    
    // Move to revealed state
    footer.dispatchEvent(new CustomEvent("primary-click", { bubbles: true, composed: true }));

    const resultSpy = vi.fn();
    element.addEventListener("reading-result", resultSpy);

    // Click "Got it right"
    footer.dispatchEvent(new CustomEvent("primary-click", { bubbles: true, composed: true }));
    expect(resultSpy).toHaveBeenCalled();
    expect(resultSpy.mock.calls[0][0].detail.success).toBe(true);

    // Click "Need practice"
    footer.dispatchEvent(new CustomEvent("secondary-click", { bubbles: true, composed: true }));
    expect(resultSpy).toHaveBeenCalledTimes(2);
    expect(resultSpy.mock.calls[1][0].detail.success).toBe(false);
  });
});
