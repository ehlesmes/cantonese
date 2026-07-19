/// <reference types="vite/client" />
import { state, loadState } from "./practice/state.js";
import {
  updateExpandCollapseAllButton,
  renderDashboard,
  renderPoolDirectory,
} from "./practice/dashboard.js";
import {
  startPracticeSession,
  quitSession,
  exitSession,
  gradeCardResponse,
  checkCurrentAnswer,
  resetCurrentCard,
  revealAnswer,
} from "./practice/gameplay.js";
import type { ClientVocab, ClientExample } from "../types/index.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

declare global {
  interface Window {
    __allVocab?: ClientVocab[];
    __allExamples?: ClientExample[];
  }
}

function setupEventListeners() {
  setupTabs();
  setupGroupTabs();
  setupExpandCollapse();
  setupSessionButtons();

  // Vocab UI binds
  getEl("flashcard-reveal-btn").addEventListener("click", revealAnswer);
  getEl("grade-forgot-btn").addEventListener("click", () =>
    gradeCardResponse(false),
  );
  getEl("grade-remembered-btn").addEventListener("click", () =>
    gradeCardResponse(true),
  );

  // Phrase UI binds
  getEl("game-reset-btn").addEventListener("click", resetCurrentCard);
  getEl("game-check-btn").addEventListener("click", checkCurrentAnswer);
}

function setupTabs() {
  const tabVocab = getEl("tab-vocab-btn");
  const tabPhrase = getEl("tab-phrase-btn");

  tabVocab.addEventListener("click", () => {
    tabVocab.classList.add("active");
    tabVocab.style.color = "var(--accent-color)";
    tabVocab.style.borderBottom = "2px solid var(--accent-color)";

    tabPhrase.classList.remove("active");
    tabPhrase.style.color = "var(--text-muted)";
    tabPhrase.style.borderBottom = "none";

    state.currentTabMode = "vocab";
    renderPoolDirectory();
  });

  tabPhrase.addEventListener("click", () => {
    tabPhrase.classList.add("active");
    tabPhrase.style.color = "var(--accent-color)";
    tabPhrase.style.borderBottom = "2px solid var(--accent-color)";

    tabVocab.classList.remove("active");
    tabVocab.style.color = "var(--text-muted)";
    tabVocab.style.borderBottom = "none";

    state.currentTabMode = "phrase";
    renderPoolDirectory();
  });
}

function setupGroupTabs() {
  const groupChapterBtn = getEl("group-by-chapter-btn");
  const groupLevelBtn = getEl("group-by-level-btn");

  groupChapterBtn.addEventListener("click", () => {
    groupChapterBtn.classList.add("active");
    groupLevelBtn.classList.remove("active");
    state.currentGroupMode = "chapter";
    renderPoolDirectory();
  });

  groupLevelBtn.addEventListener("click", () => {
    groupLevelBtn.classList.add("active");
    groupChapterBtn.classList.remove("active");
    state.currentGroupMode = "level";
    renderPoolDirectory();
  });
}

function setupExpandCollapse() {
  const expandCollapseBtn = getEl("expand-collapse-all-btn");
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

function setupSessionButtons() {
  getEl("start-session-btn").addEventListener("click", () =>
    startPracticeSession(),
  );
  getEl("session-quit-btn").addEventListener("click", quitSession);
  getEl("summary-dashboard-btn").addEventListener("click", exitSession);
  getEl("summary-retry-btn").addEventListener("click", () => {
    exitSession();
    startPracticeSession();
  });
}

async function initialize() {
  try {
    let rawVocab: ClientVocab[] = [];
    let rawPhrases: ClientExample[] = [];

    if (
      typeof window !== "undefined" &&
      window.__allVocab &&
      window.__allExamples
    ) {
      rawVocab = window.__allVocab;
      rawPhrases = window.__allExamples;
    } else {
      const baseUrl = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : import.meta.env.BASE_URL + "/";

      const [vocabRes, phraseRes] = await Promise.all([
        fetch(`${baseUrl}data/vocabulary.json`),
        fetch(`${baseUrl}data/phrasebook.json`),
      ]);

      rawVocab = (await vocabRes.json()) as ClientVocab[];
      rawPhrases = (await phraseRes.json()) as ClientExample[];

      if (typeof window !== "undefined") {
        window.__allVocab = rawVocab;
        window.__allExamples = rawPhrases;
      }
    }

    state.allVocab = rawVocab;
    state.allPhrases = rawPhrases;

    loadState();
    renderDashboard();
    setupEventListeners();
  } catch (e) {
    console.error("Initialization failed:", e);
  }
}

// Run initialization
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initialize);
}
