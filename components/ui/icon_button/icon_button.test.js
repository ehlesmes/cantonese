import { describe, it, expect, beforeEach } from "vitest";
import { IconButton } from "./icon_button.js";

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

  it("should update button title and disabled state based on data", () => {
    const component = new IconButton({
      title: "Play",
      icon: "play",
      disabled: true,
    });

    const btn = component.shadowRoot.querySelector("button");
    expect(btn.title).toBe("Play");
    expect(btn.disabled).toBe(true);

    component.data = { disabled: false };
    expect(btn.disabled).toBe(false);
  });

  it("should apply correct class based on variant", () => {
    const component = new IconButton({
      title: "Play",
      icon: "play",
      filled: true,
    });

    const btn = component.shadowRoot.querySelector("button");
    expect(btn.classList.contains("btn-filled")).toBe(true);
    expect(btn.classList.contains("btn-outline")).toBe(false);

    component.data = { filled: false };
    expect(btn.classList.contains("btn-outline")).toBe(true);
    expect(btn.classList.contains("btn-filled")).toBe(false);
  });

  it("should display the icon in the host element textContent", () => {
    const component = new IconButton({ title: "Search", icon: "search" });
    const btn = component.shadowRoot.querySelector("button");
    expect(btn.title).toBe("Search");
    expect(btn.textContent).toBe("search");

    component.data = { title: "Close", icon: "close" };
    expect(btn.title).toBe("Close");
    expect(btn.textContent).toBe("close");
  });
});
