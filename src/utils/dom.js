/**
 * Pure DOM utilities for declarative element construction.
 *
 * @param {string} tag
 * @param {object} props
 * @param {Array<HTMLElement|string>} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on") && typeof v === "function") {
      element.addEventListener(k.toLowerCase().substring(2), v);
    } else if (k === "className") {
      element.className = v;
    } else if (k === "style") {
      if (typeof v === "string") {
        element.style.cssText = v;
      } else {
        Object.assign(element.style, v);
      }
    } else if (k === "dataset") {
      for (const [dataKey, dataVal] of Object.entries(v)) {
        element.dataset[dataKey] = dataVal;
      }
    } else if (k === "innerHTML") {
      element.innerHTML = v;
    } else if (k === "textContent") {
      element.textContent = v;
    } else {
      element.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * Reusable chevron icon SVG element.
 */
export function createChevronIcon() {
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
