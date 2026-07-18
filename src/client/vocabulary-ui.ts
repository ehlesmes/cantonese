/// <reference types="vite/client" />
import {
  getUnlockedChapters,
  getVocabSRS,
  saveVocabSRS,
} from "../utils/storage.js";
import { PracticeSession } from "../utils/practice-session.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

import type { ClientVocab, SrsStateMap } from "../types/index.js";

// Global state and references
let allVocab: ClientVocab[] = [];
let unlockedChapters: string[] = [];
let vocabSRSState: SrsStateMap = {};
let session: PracticeSession<ClientVocab> | null = null;
let currentGroupMode = "chapter"; // "chapter" or "level"

// Fetch data and initialize
async function initialize() {
  try {
    if (typeof window !== "undefined" && window.__allVocab) {
      allVocab = window.__allVocab;
    } else {
      const baseUrl = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : import.meta.env.BASE_URL + "/";
      const response = await fetch(`${baseUrl}data/vocabulary.json`);
      allVocab = (await response.json()) as ClientVocab[];
      if (typeof window !== "undefined") {
        window.__allVocab = allVocab;
      }
    }

    loadState();
    renderDashboard();
    setupEventListeners();
  } catch (e) {
    console.error("Initialization failed:", e);
  }
}

function loadState() {
  unlockedChapters = getUnlockedChapters();
  vocabSRSState = getVocabSRS();
}

function saveState() {
  saveVocabSRS(vocabSRSState);
}

function setupEventListeners() {
  // Bind Start Game Button
  const startBtn = getEl("start-session-btn");
  if (startBtn)
    startBtn.addEventListener("click", () => startPracticeSession());

  // Bind Quit Button
  const quitBtn = getEl("session-quit-btn");
  if (quitBtn) quitBtn.addEventListener("click", quitSession);

  // Bind Summary Buttons
  const summaryDashBtn = getEl("summary-dashboard-btn");
  if (summaryDashBtn) summaryDashBtn.addEventListener("click", exitSession);

  const summaryRetryBtn = getEl("summary-retry-btn");
  if (summaryRetryBtn) {
    summaryRetryBtn.addEventListener("click", () => {
      exitSession();
      startPracticeSession();
    });
  }

  // Bind Gameplay Actions
  const revealBtn = getEl("flashcard-reveal-btn");
  if (revealBtn) revealBtn.addEventListener("click", revealAnswer);

  const forgotBtn = getEl("grade-forgot-btn");
  if (forgotBtn)
    forgotBtn.addEventListener("click", () => gradeCardResponse(false));

  const rememberedBtn = getEl("grade-remembered-btn");
  if (rememberedBtn)
    rememberedBtn.addEventListener("click", () => gradeCardResponse(true));

  // Bind Directory Grouping Tabs
  const groupChapterBtn = getEl("group-by-chapter-btn");
  const groupLevelBtn = getEl("group-by-level-btn");

  if (groupChapterBtn && groupLevelBtn) {
    groupChapterBtn.addEventListener("click", () => {
      groupChapterBtn.classList.add("active");
      groupLevelBtn.classList.remove("active");
      currentGroupMode = "chapter";
      renderPoolDirectory();
    });
    groupLevelBtn.addEventListener("click", () => {
      groupLevelBtn.classList.add("active");
      groupChapterBtn.classList.remove("active");
      currentGroupMode = "level";
      renderPoolDirectory();
    });
  }

  // Bind Expand/Collapse All Button
  const expandCollapseBtn = getEl("expand-collapse-all-btn");
  if (expandCollapseBtn) {
    expandCollapseBtn.addEventListener("click", () => {
      const total = document.querySelectorAll(".directory-section").length;
      const collapsed = document.querySelectorAll(
        ".directory-section.collapsed",
      ).length;
      const sections = document.querySelectorAll(".directory-section");

      if (collapsed === total) {
        sections.forEach((s) => s.classList.remove("collapsed"));
      } else {
        sections.forEach((s) => s.classList.add("collapsed"));
      }
      updateExpandCollapseAllButton();
    });
  }
}

function updateExpandCollapseAllButton() {
  const btn = getEl("expand-collapse-all-btn");
  if (!btn) return;
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

// Renders stats and list
function renderDashboard() {
  const statsChaptersEl = getEl("stats-chapters-count");
  const statsCardsEl = getEl("stats-cards-count");
  const statsMasteredEl = getEl("stats-mastered-count");

  const poolItems = allVocab.filter((item) =>
    unlockedChapters.includes(item.chapter),
  );

  let masteredCount = 0;
  poolItems.forEach((item) => {
    const itemState = vocabSRSState[item.id];
    if (itemState && itemState.level === 5) masteredCount++;
  });

  if (statsChaptersEl)
    statsChaptersEl.textContent = String(unlockedChapters.length);
  if (statsCardsEl) statsCardsEl.textContent = String(poolItems.length);
  if (statsMasteredEl) statsMasteredEl.textContent = String(masteredCount);

  renderPoolDirectory();
}

// Renders list
function renderPoolDirectory() {
  const container = getEl("review-items-list-container");
  if (!container) return;

  const poolItems = allVocab.filter((item) =>
    unlockedChapters.includes(item.chapter),
  );

  if (poolItems.length === 0) {
    container.innerHTML = `<p style="font-size: 0.95rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem;">No items available. Mark chapters as completed to populate your review pool.</p>`;
    updateExpandCollapseAllButton();
    return;
  }

  container.innerHTML = "";

  const chevronSvg = `
    <svg class="chevron-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  if (currentGroupMode === "chapter") {
    const grouped: Record<
      string,
      { title: string; chapterNumber: number; items: ClientVocab[] }
    > = {};
    poolItems.forEach((item) => {
      let group = grouped[item.chapter];
      if (!group) {
        group = {
          title: item.chapterTitle,
          chapterNumber: item.chapterNumber,
          items: [],
        };
        grouped[item.chapter] = group;
      }
      group.items.push(item);
    });

    const sortedChapterIds = Object.keys(grouped).sort((a, b) => {
      const groupA = grouped[a];
      const groupB = grouped[b];
      if (!groupA || !groupB) return 0;
      return groupA.chapterNumber - groupB.chapterNumber;
    });

    sortedChapterIds.forEach((chId) => {
      const group = grouped[chId];
      if (!group) return;
      const section = document.createElement("div");
      section.className = "directory-section";

      const header = document.createElement("div");
      header.className = "directory-group-header";
      header.innerHTML = `
        <div class="header-left">
          ${chevronSvg}
          <span class="group-title">Chapter ${group.chapterNumber}: ${group.title}</span>
          <span class="item-count-badge">${group.items.length}</span>
        </div>
        <button class="small-btn">Review</button>
      `;

      const content = document.createElement("div");
      content.className = "directory-group-content review-items-container";

      group.items.forEach((item: ClientVocab) => {
        content.appendChild(createItemCardElement(item));
      });

      // Toggle collapse on header click
      header.addEventListener("click", () => {
        section.classList.toggle("collapsed");
        updateExpandCollapseAllButton();
      });

      // Stop click propagation on review button and trigger session
      const reviewBtn = header.querySelector("button");
      if (reviewBtn) {
        reviewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          startPracticeSession(chId, null);
        });
      }

      section.appendChild(header);
      section.appendChild(content);
      container.appendChild(section);
    });
  } else {
    const grouped: Record<number, ClientVocab[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    poolItems.forEach((item) => {
      const state = vocabSRSState[item.id];
      const lvl = state ? state.level : 1;
      const group = grouped[lvl];
      if (group) group.push(item);
    });

    for (let lvl = 1; lvl <= 5; lvl++) {
      const items = grouped[lvl];
      if (!items || items.length === 0) continue;

      const section = document.createElement("div");
      section.className = "directory-section";

      const header = document.createElement("div");
      header.className = "directory-group-header";
      header.innerHTML = `
        <div class="header-left">
          ${chevronSvg}
          <span class="group-title">SRS Level ${lvl}</span>
          <span class="item-count-badge">${items.length}</span>
        </div>
        <button class="small-btn">Review</button>
      `;

      const content = document.createElement("div");
      content.className = "directory-group-content review-items-container";

      items.forEach((item: ClientVocab) => {
        content.appendChild(createItemCardElement(item));
      });

      // Toggle collapse on header click
      header.addEventListener("click", () => {
        section.classList.toggle("collapsed");
        updateExpandCollapseAllButton();
      });

      // Stop click propagation on review button and trigger session
      const reviewBtn = header.querySelector("button");
      if (reviewBtn) {
        reviewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          startPracticeSession(null, lvl);
        });
      }

      section.appendChild(header);
      section.appendChild(content);
      container.appendChild(section);
    }
  }

  updateExpandCollapseAllButton();
}

// Helper to generate a single directory item card
function createItemCardElement(item: ClientVocab) {
  const state = vocabSRSState[item.id];
  const lvl = state ? state.level : 1;

  const card = document.createElement("div");
  card.className = "review-item-card";

  const textContainer = document.createElement("div");
  textContainer.className = "review-item-text";

  const cantoDiv = document.createElement("div");
  cantoDiv.className = "review-item-canto";
  cantoDiv.innerHTML = `<span class="vocab-term" data-audio-hash="">${item.character}<span class="tooltip-popover"><strong>${item.jyutping}</strong><br/>${item.translation}</span></span>`;

  const engDiv = document.createElement("div");
  engDiv.className = "review-item-english";
  engDiv.textContent = `${item.jyutping} — ${item.translation}`;

  textContainer.appendChild(cantoDiv);
  textContainer.appendChild(engDiv);

  const badge = document.createElement("span");
  badge.className = `srs-level-badge srs-level-${lvl}`;
  badge.textContent = `Lvl ${lvl}`;

  card.appendChild(textContainer);
  card.appendChild(badge);
  return card;
}

// --- GAMEPLAY SESSION CONTROLS ---

function startPracticeSession(
  chapterId: string | null = null,
  srsLevel: number | string | null = null,
) {
  let poolItems: ClientVocab[] = [];
  if (typeof chapterId === "string" && chapterId) {
    poolItems = allVocab.filter((item) => item.chapter === chapterId);
  } else if (srsLevel !== null && !Number.isNaN(Number(srsLevel))) {
    poolItems = allVocab.filter((item) => {
      const state = vocabSRSState[item.id];
      const lvl = state ? state.level : 1;
      return lvl === Number(srsLevel);
    });
  } else {
    poolItems = allVocab.filter((item) =>
      unlockedChapters.includes(item.chapter),
    );
  }

  if (poolItems.length === 0) {
    if (typeof chapterId === "string") {
      alert("This chapter has no vocabulary to review.");
    } else if (srsLevel !== null) {
      alert(`You have no vocabulary at SRS Level ${srsLevel} to review.`);
    } else {
      alert(
        "Your vocabulary review pool is empty. Mark chapters as completed to start practice.",
      );
    }
    return;
  }

  session = new PracticeSession({
    poolItems,
    srsState: vocabSRSState,
    limit: 10,
  });

  getEl("dashboard-view").style.display = "none";
  getEl("session-view").style.display = "flex";
  getEl("summary-view").style.display = "none";

  // Preload audio files for all cards in this session to eliminate playback latency
  if (window.preloadTexts) {
    window.preloadTexts(
      session.cards.map((c) => ({ text: c.character, hash: "" })),
    );
  }

  loadCard();
}

function loadCard() {
  if (!session || session.isFinished()) {
    showSummary();
    return;
  }

  const card = session.getCurrentCard()!;
  const index = session.getCurrentIndex();
  const progress = session.getProgress();

  getEl("session-progress-text")!.textContent =
    `Card ${index + 1} of ${session.cards.length}`;
  getEl("session-progress-fill").style.width = `${progress.percentage}%`;

  getEl("session-chapter-label").textContent =
    `Chapter ${card.chapter}: ${card.chapterTitle}`;

  // Reset card visual state
  getEl("flashcard-answer-section").style.display = "none";
  getEl("flashcard-reveal-btn").style.display = "block";

  // Load character with hover tooltip showing only Jyutping
  const charContainer = getEl("flashcard-character-container");
  if (!charContainer) return;
  charContainer.innerHTML = `<span class="vocab-term" data-audio-hash="">${card.character}<span class="tooltip-popover"><strong>${card.jyutping}</strong></span></span>`;

  // Set translation
  getEl("flashcard-translation-text").textContent = card.translation;
}

function revealAnswer() {
  getEl("flashcard-answer-section").style.display = "block";
  getEl("flashcard-reveal-btn").style.display = "none";

  // Automatically play TTS audio when answer is revealed by clicking the term
  const termEl = document.querySelector(
    "#flashcard-character-container .vocab-term",
  );
  if (termEl instanceof HTMLElement) {
    termEl.click();
  }
}

function gradeCardResponse(remembered: boolean) {
  if (!session) return;
  session.submitResponse(remembered);
  vocabSRSState = session.getUpdatedSrsState();
  saveState();

  // Proceed immediately to the next card
  loadCard();
}

function showSummary() {
  if (!session) return;
  getEl("session-view").style.display = "none";
  getEl("summary-view").style.display = "flex";

  const results = session.getResults();
  getEl("summary-score").textContent = `${results.correct} / ${results.total}`;

  const scorePercentage = results.percentage;
  let msg =
    "Great practice! Spaced Repetition reinforces memory paths. Continue practicing regularly!";
  if (scorePercentage === 100) {
    msg =
      "Perfect score! You have fully mastered these vocabulary terms. Keep adding new chapters!";
  } else if (scorePercentage >= 80) {
    msg =
      "Excellent job! Most words are secure. A little more practice will lock in the rest.";
  } else if (scorePercentage < 50) {
    msg =
      "Spaced repetition works best on words we struggle with! Keep trying, they will get easier.";
  }
  getEl("summary-message").textContent = msg;
}

function quitSession() {
  if (
    confirm(
      "Are you sure you want to quit this practice session? Your progress on finished cards is already saved.",
    )
  ) {
    exitSession();
  }
}

function exitSession() {
  getEl("dashboard-view").style.display = "flex";
  getEl("session-view").style.display = "none";
  getEl("summary-view").style.display = "none";
  renderDashboard();
}

// Run initialization
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initialize);
}
