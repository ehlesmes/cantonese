import { describe, it, expect, beforeEach } from "vitest";
import { StatusIcon } from "./status_icon.js";

describe("StatusIcon Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  describe("Validation", () => {
    it("should throw if status is missing", () => {
      expect(() => new StatusIcon({})).toThrow();
    });
  });

  it("should render the correct icon for 'completed'", () => {
    const icon = new StatusIcon({ status: "completed" });
    const span = icon.shadowRoot.querySelector(".status-icon");
    expect(span.textContent).toBe("check_circle");
    expect(span.classList.contains("completed")).toBe(true);
  });

  it("should render the correct icon for 'in-progress'", () => {
    const icon = new StatusIcon({ status: "in-progress" });
    const span = icon.shadowRoot.querySelector(".status-icon");
    expect(span.textContent).toBe("incomplete_circle");
    expect(span.classList.contains("in-progress")).toBe(true);
  });

  it("should render the correct icon for 'not-started'", () => {
    const icon = new StatusIcon({ status: "not-started" });
    const span = icon.shadowRoot.querySelector(".status-icon");
    expect(span.textContent).toBe("circle");
    expect(span.classList.contains("not-started")).toBe(true);
  });

  it("should update status dynamically via setter", () => {
    const icon = new StatusIcon({ status: "not-started" });
    icon.status = "completed";

    const span = icon.shadowRoot.querySelector(".status-icon");
    expect(span.textContent).toBe("check_circle");
    expect(span.classList.contains("completed")).toBe(true);
  });
});
