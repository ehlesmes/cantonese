import { el, createPlayIcon } from "../sys/dom.js";
import { compileAnnotationsClient } from "../../utils/dom.js";
import type { ClientExample } from "../../types/index.js";
import { state } from "./state.js";

export function buildFeedbackNextBtn(
  isCorrect: boolean,
  onNextClick: () => void,
) {
  return el("button", {
    id: "next-card-btn",
    style:
      "margin-top: 1rem; font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; border: none; background-color: " +
      (isCorrect ? "var(--secondary-color)" : "var(--accent-color)") +
      "; color: #ffffff; border-radius: 4px; padding: 0.5rem 1.5rem; cursor: pointer; float: right;",
    textContent: "Next Card →",
    onClick: onNextClick,
  });
}

export function buildFeedbackIncorrectOrder(card: ClientExample) {
  return el("div", { style: "font-size: 0.95rem; margin-bottom: 0.6rem;" }, [
    el("strong", { textContent: "Your Order" }),
    document.createTextNode(": "),
    el("span", {
      style: "color: var(--accent-color);",
      textContent: state.assembledTokenIndices
        .map((idx) => {
          const raw = card.tokens[idx];
          if (!raw) return "";
          const m = raw.match(/^([^[]+)/);
          return m ? m[1] : raw;
        })
        .filter(Boolean)
        .join(" "),
    }),
  ]);
}

export function buildFeedbackCardContent(
  card: ClientExample,
  isCorrect: boolean,
  onNextClick: () => void,
) {
  const compiledCantoHtml = compileAnnotationsClient(
    card.cantoneseRaw,
    false,
    card.tokenHashes,
  );

  const ttsBtn = el(
    "button",
    {
      className: "tts-btn",
      dataset: { audioHash: card.audioHash },
      title: "Listen",
      "aria-label": "Listen",
    },
    [createPlayIcon()],
  );

  return el("div", { className: "alert-content" }, [
    !isCorrect ? buildFeedbackIncorrectOrder(card) : null,
    !isCorrect
      ? el("div", {
          style: "font-size: 0.95rem; font-weight: 600; margin-bottom: 0.2rem;",
          textContent: "Correct Structure:",
        })
      : null,
    el(
      "div",
      {
        className: "cantonese-example-card",
        style:
          "border: none; background: transparent; padding: 0; margin: 0; box-shadow: none; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;",
      },
      [
        el("div", {
          className: "cantonese-sentence",
          style: "font-size: 1.25rem;",
          innerHTML: compiledCantoHtml,
        }),
        ttsBtn,
      ],
    ),
    el("div", {
      style:
        "font-size: 0.95rem; color: var(--text-muted); font-style: italic; margin-top: 0.3rem;",
      textContent: card.english,
    }),
    buildFeedbackNextBtn(isCorrect, onNextClick),
    el("div", { style: "clear: both;" }),
  ]);
}

export function createFeedbackAlert(
  card: ClientExample,
  isCorrect: boolean,
  newSrsLevel: number,
  onNextClick: () => void,
): HTMLElement {
  const cardHtml = buildFeedbackCardContent(card, isCorrect, onNextClick);

  return el(
    "div",
    {
      className: isCorrect
        ? "alert-box alert-tip"
        : "alert-box alert-important",
      style: isCorrect
        ? "margin-top: 1rem; border-left-color: var(--secondary-color); background-color: #ecf0e5;"
        : "margin-top: 1rem; border-left-color: var(--accent-color); background-color: #f8efe6;",
    },
    [
      el("div", {
        className: "alert-title",
        style: isCorrect
          ? "color: var(--secondary-color);"
          : "color: var(--accent-color);",
        textContent: isCorrect
          ? `Correct! (SRS Level Up to ${newSrsLevel})`
          : `Incorrect (SRS Level Down to ${newSrsLevel})`,
      }),
      cardHtml,
    ],
  ) as HTMLElement;
}
