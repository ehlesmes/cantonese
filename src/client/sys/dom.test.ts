/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { el, createChevronIcon, createPlayIcon } from "./dom.js";

describe("Sys DOM Utilities Spec", () => {
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
    (btn as HTMLElement).click();
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
      title: undefined,
      placeholder: null,
    });
    expect(input.getAttribute("type")).toBe("checkbox");
    expect(input.getAttribute("id")).toBe("my-id");
    expect(input.getAttribute("checked")).toBe("true");
    expect(input.hasAttribute("title")).toBe(false);
    expect(input.hasAttribute("placeholder")).toBe(false);
  });

  test("el() should nest children correctly, ignoring nulls", () => {
    const child1 = el("span", { textContent: "1" });
    const child2 = el("span", { textContent: "2" });
    const parent = el("div", {}, [
      child1,
      null,
      "TextNode",
      {} as unknown as HTMLElement,
      child2,
    ]);

    expect(parent.childNodes.length).toBe(3);
    expect(parent.childNodes[0]).toBe(child1);
    expect(parent.childNodes[1]?.nodeType).toBe(3); // TextNode
    expect(parent.childNodes[1]?.textContent).toBe("TextNode");
    expect(parent.childNodes[2]).toBe(child2);
  });

  test("el() should create SVG elements with correct namespace, and HTML elements with default namespace", () => {
    const svgTags = [
      "svg",
      "polyline",
      "path",
      "circle",
      "polygon",
      "rect",
      "g",
    ];
    for (const tag of svgTags) {
      const element = el(tag);
      expect(element.namespaceURI).toBe("http://www.w3.org/2000/svg");
    }

    const htmlTags = ["div", "span", "button", "input"];
    for (const tag of htmlTags) {
      const element = el(tag);
      expect(element.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    }
  });

  test("createChevronIcon() should build a chevron SVG", () => {
    const icon = createChevronIcon();
    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(icon.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(icon.classList.contains("chevron-icon")).toBe(true);
    expect(icon.childNodes.length).toBe(1); // polyline
  });

  test("createPlayIcon() should build a play SVG", () => {
    const icon = createPlayIcon();
    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(icon.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(icon.childNodes.length).toBe(3); // polygon, path, path
  });

  test("applyStyle handles null and non-object", () => {
    // Should not throw
    const div1 = el("div", { style: null as unknown as string });
    expect(div1.style.cssText).toBe("");

    const div2 = el("div", { style: 123 as unknown as string });
    expect(div2.style.cssText).toBe("");
  });

  test("applyDataset ignores null and undefined entries", () => {
    // Should safely ignore null dataset and null/undefined values
    const div = el("div", {
      dataset: null as unknown as Record<string, string>,
    });
    expect(Object.keys(div.dataset).length).toBe(0);

    const div2 = el("div", {
      dataset: {
        valid: "yes",
        invalid1: null as unknown as string,
        invalid2: undefined as unknown as string,
      },
    });
    expect(div2.dataset.valid).toBe("yes");
    expect(div2.dataset.invalid1).toBeUndefined();
    expect(div2.dataset.invalid2).toBeUndefined();
  });
});
