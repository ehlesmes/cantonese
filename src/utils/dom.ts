export interface ElementProps {
  className?: string;
  style?: string | Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
  innerHTML?: string;
  textContent?: string;
  [key: string]: unknown;
}

export type ElementChild = Node | string | number | null | undefined;

/**
 * Pure DOM utilities for declarative element construction.
 */
export function el(
  tag: string,
  props: ElementProps = {},
  children: ElementChild[] = [],
): HTMLElement | SVGElement {
  let element: HTMLElement | SVGElement;

  // SVG tags need namespace to render properly in HTML
  if (
    tag === "svg" ||
    tag === "polyline" ||
    tag === "path" ||
    tag === "circle" ||
    tag === "polygon" ||
    tag === "rect" ||
    tag === "g"
  ) {
    element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag,
    ) as SVGElement;
  } else {
    element = document.createElement(tag);
  }

  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on") && typeof v === "function") {
      element.addEventListener(
        k.toLowerCase().substring(2),
        v as EventListenerOrEventListenerObject,
      );
    } else if (k === "className") {
      if (element instanceof SVGElement) {
        (
          element as unknown as { className: SVGAnimatedString }
        ).className.baseVal = v as string;
      } else {
        element.className = v as string;
      }
    } else if (k === "style") {
      if (typeof v === "string") {
        element.style.cssText = v;
      } else {
        Object.assign(element.style, v as object);
      }
    } else if (k === "dataset") {
      const htmlEl = element as HTMLElement;
      for (const [dataKey, dataVal] of Object.entries(
        v as Record<string, string>,
      )) {
        htmlEl.dataset[dataKey] = dataVal;
      }
    } else if (k === "innerHTML") {
      element.innerHTML = v as string;
    } else if (k === "textContent") {
      element.textContent = String(v);
    } else {
      if (v !== undefined && v !== null) {
        element.setAttribute(k, String(v));
      }
    }
  }

  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

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
 * Transforms Markdown-style annotations into HTML spans.
 * `Character[Jyutping|Translation]` -> `<span class="vocab-term"...>`
 */
export function compileAnnotationsClient(
  text: string,
  hideTranslation = true,
  tokenHashes: Record<string, string> = {},
) {
  if (!text) return "";
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  return text.replace(blockRegex, (_match, char, jyutping, translation) => {
    const hash = tokenHashes[char] || "";
    if (hideTranslation) {
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong></span></span>`;
    }
    return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  });
}
