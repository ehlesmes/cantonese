import { describe, it, expect, beforeEach, vi } from "vitest";
import { DashboardPage } from "./dashboard_page.js";

describe("DashboardPage Component", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    // Mock fetch for lessons.json
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ chapters: [] }),
        }),
      ),
    );
  });

  it("should render hero and roadmap slots initially", () => {
    const page = new DashboardPage();
    expect(page.shadowRoot.querySelector(".hero-section")).not.toBeNull();
    expect(page.shadowRoot.querySelector(".roadmap-container")).not.toBeNull();
  });
});
