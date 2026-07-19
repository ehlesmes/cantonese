export interface ElementProps {
  className?: string;
  style?: string | Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
  innerHTML?: string;
  textContent?: string;
  [key: string]: unknown;
}

export type ElementChild = Node | string | number | null | undefined;

export function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el) return el;
  throw new Error("Missing DOM element: " + id);
}

export function getInputElement(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLInputElement) return el;
  throw new Error("Missing input element: " + id);
}

export function getTextAreaElement(id: string): HTMLTextAreaElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLTextAreaElement) return el;
  throw new Error("Missing textarea element: " + id);
}

export function getCanvasElement(id: string): HTMLCanvasElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLCanvasElement) return el;
  throw new Error("Missing canvas element: " + id);
}

export function getVideoElement(id: string): HTMLVideoElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLVideoElement) return el;
  throw new Error("Missing video element: " + id);
}

export function getButtonElement(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLButtonElement) return el;
  throw new Error("Missing button element: " + id);
}

function createElementByTag(tag: string): HTMLElement | SVGElement {
  if (
    tag === "svg" ||
    tag === "polyline" ||
    tag === "path" ||
    tag === "circle" ||
    tag === "polygon" ||
    tag === "rect" ||
    tag === "g"
  ) {
    return document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag,
    ) as SVGElement;
  }
  return document.createElement(tag);
}

function applyClassName(element: HTMLElement | SVGElement, v: unknown) {
  if (element instanceof SVGElement) {
    element.setAttribute("class", String(v));
  } else {
    element.className = String(v);
  }
}

function applyStyle(element: HTMLElement | SVGElement, v: unknown) {
  if (typeof v === "string") {
    element.style.cssText = v;
  } else if (typeof v === "object" && v !== null) {
    Object.assign(element.style, v);
  }
}

function applyDataset(element: HTMLElement | SVGElement, v: unknown) {
  if (typeof v !== "object" || v === null) return;
  const htmlEl = element as HTMLElement;
  for (const [dataKey, dataVal] of Object.entries(v)) {
    if (dataVal !== undefined && dataVal !== null) {
      htmlEl.dataset[dataKey] = String(dataVal);
    }
  }
}

function applyProps(element: HTMLElement | SVGElement, props: ElementProps) {
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on") && typeof v === "function") {
      element.addEventListener(
        k.toLowerCase().substring(2),
        v as EventListenerOrEventListenerObject,
      );
    } else if (k === "className") {
      applyClassName(element, v);
    } else if (k === "style") {
      applyStyle(element, v);
    } else if (k === "dataset") {
      applyDataset(element, v);
    } else if (k === "innerHTML") {
      element.innerHTML = String(v);
    } else if (k === "textContent") {
      element.textContent = String(v);
    } else {
      if (v !== undefined && v !== null) {
        element.setAttribute(k, String(v));
      }
    }
  }
}

function appendChildren(
  element: HTMLElement | SVGElement,
  children: ElementChild[],
) {
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
}

/**
 * Pure DOM utilities for declarative element construction.
 */
export function el(
  tag: string,
  props: ElementProps = {},
  children: ElementChild[] = [],
): HTMLElement | SVGElement {
  const element = createElementByTag(tag);
  applyProps(element, props);
  appendChildren(element, children);
  return element;
}

/**
 * Reusable chevron icon SVG element.
 */
export function createChevronIcon(): HTMLElement | SVGElement {
  return el(
    "svg",
    {
      className: "chevron-icon",
      viewBox: "0 0 24 24",
      width: "14",
      height: "14",
      stroke: "currentColor",
      "stroke-width": "3",
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: "vertical-align: middle;",
    },
    [el("polyline", { points: "9 18 15 12 9 6" })],
  );
}

/**
 * Reusable play icon SVG element.
 */
export function createPlayIcon(): HTMLElement | SVGElement {
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: "20",
      height: "20",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      el("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }),
      el("path", { d: "M15.54 8.46a5 5 0 0 1 0 7.07" }),
      el("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14" }),
    ],
  );
}
