/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { el, createChevronIcon } from "../src/utils/dom.js";

describe("DOM Utilities Spec", () => {
  test("el() should construct a basic element", () => {
    const div = el("div", { className: "test-class", textContent: "Hello" });
    expect(div.tagName).toBe("DIV");
    expect(div.className).toBe("test-class");
    expect(div.textContent).toBe("Hello");
  });

  test("el() should handle innerHTML", () => {
    const div = el("div", { innerHTML: "<span>Inner</span>" });
    expect(div.innerHTML).toBe("<span>Inner</span>");
    expect(div.querySelector("span")).not.toBeNull();
  });

  test("el() should attach event listeners", () => {
    const clickSpy = vi.fn();
    const btn = el("button", { onClick: clickSpy });
    btn.click();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test("el() should handle style object and string", () => {
    const div1 = el("div", { style: "color: red; margin-top: 10px;" });
    expect(div1.style.color).toBe("red");
    expect(div1.style.marginTop).toBe("10px");

    const div2 = el("div", {
      style: { display: "flex", alignContent: "center" },
    });
    expect(div2.style.display).toBe("flex");
    expect(div2.style.alignContent).toBe("center");
  });

  test("el() should assign data attributes via dataset", () => {
    const span = el("span", { dataset: { userId: "123", role: "admin" } });
    expect(span.dataset.userId).toBe("123");
    expect(span.dataset.role).toBe("admin");
  });

  test("el() should set standard attributes as fallback", () => {
    const input = el("input", {
      type: "checkbox",
      id: "my-id",
      checked: "true",
    });
    expect(input.getAttribute("type")).toBe("checkbox");
    expect(input.getAttribute("id")).toBe("my-id");
    expect(input.getAttribute("checked")).toBe("true");
  });

  test("el() should nest children correctly, ignoring nulls", () => {
    const child1 = el("span", { textContent: "1" });
    const child2 = el("span", { textContent: "2" });
    const parent = el("div", {}, [child1, null, "TextNode", {}, child2]);

    expect(parent.childNodes.length).toBe(3);
    expect(parent.childNodes[0]).toBe(child1);
    expect(parent.childNodes[1].nodeType).toBe(3); // TextNode
    expect(parent.childNodes[1].textContent).toBe("TextNode");
    expect(parent.childNodes[2]).toBe(child2);
  });

  test("createChevronIcon() should return an SVG element", () => {
    const svg = createChevronIcon();
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("class")).toBe("chevron-icon");
    expect(svg.querySelector("polyline")).not.toBeNull();
  });
});
