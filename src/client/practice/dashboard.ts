import { el, createChevronIcon } from "../sys/dom.js";
import { compileAnnotationsClient } from "../../utils/dom.js";
import {
  groupItemsForDirectory,
  filterByUnlockedChapters,
  countMasteredItems,
} from "../../utils/srs-engine.js";
import type { SrsStateMap } from "../../types/index.js";
import { state, getCombinedSrsState, type PracticeItem } from "./state.js";
import { startPracticeSession } from "./gameplay.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

function updateExpandCollapseAllButton() {
  const btn = getEl("expand-collapse-all-btn");
  const total = document.querySelectorAll(".directory-section").length;
  const collapsed = document.querySelectorAll(
    ".directory-section.collapsed",
  ).length;
  if (collapsed === total && total > 0) {
    btn.textContent = "Expand All";
  } else {
    btn.textContent = "Collapse All";
  }
}

function renderDashboard() {
  const statsChaptersEl = getEl("stats-chapters-count");
  const statsCardsEl = getEl("stats-cards-count");
  const statsMasteredEl = getEl("stats-mastered-count");

  const combinedItems = filterByUnlockedChapters(
    [...state.allVocab, ...state.allPhrases],
    state.unlockedChapters,
  );
  const combinedSrs = getCombinedSrsState();

  const masteredCount = countMasteredItems(combinedItems, combinedSrs);

  statsChaptersEl.textContent = String(state.unlockedChapters.length);
  statsCardsEl.textContent = String(combinedItems.length);
  statsMasteredEl.textContent = String(masteredCount);

  renderPoolDirectory();
}
function createDirectorySection(
  title: string,
  count: number,
  items: PracticeItem[],
  currentSrsState: SrsStateMap,
  onReviewClick: () => void,
): HTMLElement {
  const section = el("div", { className: "directory-section" });

  const reviewBtn = el("button", {
    className: "small-btn",
    textContent: "Review",
  });
  const header = el("div", { className: "directory-group-header" }, [
    el("div", { className: "header-left" }, [
      createChevronIcon(),
      el("span", {
        className: "group-title",
        textContent: title,
      }),
      el("span", {
        className: "item-count-badge",
        textContent: String(count),
      }),
    ]),
    reviewBtn,
  ]);

  const content = el("div", {
    className: "directory-group-content review-items-container",
  });
  items.forEach((item) => {
    content.appendChild(createItemCardElement(item, currentSrsState));
  });

  header.addEventListener("click", () => {
    section.classList.toggle("collapsed");
    updateExpandCollapseAllButton();
  });

  reviewBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onReviewClick();
  });

  section.appendChild(header);
  section.appendChild(content);

  return section as HTMLElement;
}
function renderEmptyDirectoryState(container: HTMLElement) {
  container.appendChild(
    el("p", {
      style:
        "font-size: 0.95rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem;",
      textContent:
        "No items available. Mark chapters as completed to populate your review pool.",
    }),
  );
  updateExpandCollapseAllButton();
}

function renderChapterGroup(
  container: HTMLElement,
  groupedResult: Extract<
    ReturnType<typeof groupItemsForDirectory<PracticeItem>>,
    { type: "chapter" }
  >,
  currentSrsState: SrsStateMap,
) {
  groupedResult.sortedChapterIds.forEach((chId: string) => {
    const group = groupedResult.grouped[chId]!;
    const section = createDirectorySection(
      `Chapter ${group.chapterNumber}: ${group.title}`,
      group.items.length,
      group.items,
      currentSrsState,
      () => startPracticeSession(chId, null),
    );
    container.appendChild(section);
  });
}

function renderLevelGroup(
  container: HTMLElement,
  groupedResult: Extract<
    ReturnType<typeof groupItemsForDirectory<PracticeItem>>,
    { type: "level" }
  >,
  currentSrsState: SrsStateMap,
) {
  for (let lvl = 1; lvl <= 5; lvl++) {
    const items = groupedResult.grouped[lvl];
    if (!items || items.length === 0) continue;

    const section = createDirectorySection(
      `SRS Level ${lvl}`,
      items.length,
      items,
      currentSrsState,
      () => startPracticeSession(null, lvl),
    );
    container.appendChild(section);
  }
}

function renderPoolDirectory() {
  const container = getEl("review-items-list-container");
  container.innerHTML = "";

  const poolToRender: PracticeItem[] =
    state.currentTabMode === "vocab" ? state.allVocab : state.allPhrases;
  const poolItems = filterByUnlockedChapters(
    poolToRender,
    state.unlockedChapters,
  );
  const currentSrsState =
    state.currentTabMode === "vocab"
      ? state.vocabSrsState
      : state.phraseSrsState;

  if (poolItems.length === 0) {
    return renderEmptyDirectoryState(container);
  }

  const groupedResult = groupItemsForDirectory(
    poolItems,
    currentSrsState,
    state.currentGroupMode,
  );

  if (groupedResult.type === "chapter") {
    renderChapterGroup(container, groupedResult, currentSrsState);
  } else {
    renderLevelGroup(container, groupedResult, currentSrsState);
  }

  updateExpandCollapseAllButton();
}

function createItemCardElement(item: PracticeItem, stateMap: SrsStateMap) {
  const lvl = stateMap[item.id]?.level ?? 1;

  const card = el("div", { className: "review-item-card" });
  const textContainer = el("div", { className: "review-item-text" });

  const cantoDiv = el("div", { className: "review-item-canto" });
  if (item.practiceType === "vocab") {
    cantoDiv.innerHTML = `<span class="vocab-term" data-audio-hash="">${item.character}<span class="tooltip-popover"><strong>${item.jyutping}</strong><br/>${item.translation}</span></span>`;
  } else {
    cantoDiv.innerHTML = compileAnnotationsClient(
      item.cantoneseRaw,
      false,
      item.tokenHashes,
    );
  }

  const engDiv = el("div", { className: "review-item-english" });
  if (item.practiceType === "vocab") {
    engDiv.textContent = `${item.jyutping} — ${item.translation}`;
  } else {
    engDiv.textContent = item.english;
  }

  textContainer.appendChild(cantoDiv);
  textContainer.appendChild(engDiv);

  const badge = el("span", {
    className: `srs-level-badge srs-level-${lvl}`,
    textContent: `Lvl ${lvl}`,
  });

  card.appendChild(textContainer);
  card.appendChild(badge);
  return card;
}

export { updateExpandCollapseAllButton, renderDashboard, renderPoolDirectory };
