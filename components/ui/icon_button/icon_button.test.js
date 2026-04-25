import { describe, it, expect, beforeEach } from "vitest";
import { IconButton } from "./icon_button.js";
import { buttonStyles } from "../../shared/shared_assets.js";

describe("IconButton Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined", () => {
    const component = new IconButton({ title: "title", icon: "icon" });
    expect(component).toBeInstanceOf(IconButton);
    expect(component.element).toBeInstanceOf(HTMLElement);
    expect(component.shadowRoot).not.toBeNull();
  });

  it("should apply correct class based on variant", () => {
    const filled = new IconButton({
      title: "Play",
      icon: "play",
      filled: true,
    });

    const filledBtn = filled.shadowRoot.querySelector("button");
    expect(filledBtn.classList.contains(buttonStyles.filled)).toBe(true);
    expect(filledBtn.classList.contains(buttonStyles.outline)).toBe(false);

    const outlined = new IconButton({
      title: "Play",
      icon: "play",
      filled: false,
    });

    const outlinedBtn = outlined.shadowRoot.querySelector("button");
    console.error(outlinedBtn.className, buttonStyles);
    expect(outlinedBtn.classList.contains(buttonStyles.filled)).toBe(false);
    expect(outlinedBtn.classList.contains(buttonStyles.outline)).toBe(true);
  });

  it("should display the icon in the host element textContent", () => {
    const component = new IconButton({ title: "Search", icon: "search" });
    const btn = component.shadowRoot.querySelector("button");
    expect(btn.title).toBe("Search");
    expect(btn.textContent).toBe("search");
  });
});
