/// <reference types="vite/client" />
import {
  getUnlockedChapters,
  getVocabSRS,
  saveVocabSRS,
  getPhraseSRS,
  savePhraseSRS,
} from "./sys/storage.js";
import { PracticeSession } from "../utils/practice-session.js";
import {
  filterPracticeItems,
  groupItemsForDirectory,
  filterByUnlockedChapters,
  countMasteredItems,
} from "../utils/srs-engine.js";
import { compileAnnotationsClient } from "../utils/dom.js";
import { el, createChevronIcon, createPlayIcon } from "./sys/dom.js";
import { checkPhraseAnswer } from "../utils/text.js";
import type {
  ClientVocab,
  ClientExample,
  SrsStateMap,
} from "../types/index.js";

type PracticeItem = ClientVocab | ClientExample;

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

// Global state
let allVocab: ClientVocab[] = [];
let allPhrases: ClientExample[] = [];
let unlockedChapters: string[] = [];
let vocabSrsState: SrsStateMap = {};
let phraseSrsState: SrsStateMap = {};
let session: PracticeSession<PracticeItem> | null = null;
let assembledTokenIndices: number[] = [];

// Dashboard view state
let currentGroupMode: "chapter" | "level" = "chapter";
let currentTabMode: "vocab" | "phrase" = "vocab";

// Fetch data and initialize
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

    allVocab = rawVocab;
    allPhrases = rawPhrases;

    loadState();
    renderDashboard();
    setupEventListeners();
  } catch (e) {
    console.error("Initialization failed:", e);
  }
}

function loadState() {
  unlockedChapters = getUnlockedChapters();
  vocabSrsState = getVocabSRS();
  phraseSrsState = getPhraseSRS();
}

function saveState() {
  saveVocabSRS(vocabSrsState);
  savePhraseSRS(phraseSrsState);
}

function getCombinedSrsState(): SrsStateMap {
  return { ...vocabSrsState, ...phraseSrsState };
}

function setupEventListeners() {
  // Tabs
  const tabVocab = getEl("tab-vocab-btn");
  const tabPhrase = getEl("tab-phrase-btn");

  tabVocab.addEventListener("click", () => {
    tabVocab.classList.add("active");
    tabVocab.style.color = "var(--accent-color)";
    tabVocab.style.borderBottom = "2px solid var(--accent-color)";

    tabPhrase.classList.remove("active");
    tabPhrase.style.color = "var(--text-muted)";
    tabPhrase.style.borderBottom = "none";

    currentTabMode = "vocab";
    renderPoolDirectory();
  });

  tabPhrase.addEventListener("click", () => {
    tabPhrase.classList.add("active");
    tabPhrase.style.color = "var(--accent-color)";
    tabPhrase.style.borderBottom = "2px solid var(--accent-color)";

    tabVocab.classList.remove("active");
    tabVocab.style.color = "var(--text-muted)";
    tabVocab.style.borderBottom = "none";

    currentTabMode = "phrase";
    renderPoolDirectory();
  });

  // Group Tabs
  const groupChapterBtn = getEl("group-by-chapter-btn");
  const groupLevelBtn = getEl("group-by-level-btn");

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

  // Expand / Collapse
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

  // Session Start / Stop
  getEl("start-session-btn").addEventListener("click", () =>
    startPracticeSession(),
  );
  getEl("session-quit-btn").addEventListener("click", quitSession);
  getEl("summary-dashboard-btn").addEventListener("click", exitSession);
  getEl("summary-retry-btn").addEventListener("click", () => {
    exitSession();
    startPracticeSession();
  });

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
    [...allVocab, ...allPhrases],
    unlockedChapters,
  );
  const combinedSrs = getCombinedSrsState();

  const masteredCount = countMasteredItems(combinedItems, combinedSrs);

  statsChaptersEl.textContent = String(unlockedChapters.length);
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
function renderPoolDirectory() {
  const container = getEl("review-items-list-container");
  container.innerHTML = "";

  const poolToRender: PracticeItem[] =
    currentTabMode === "vocab" ? allVocab : allPhrases;
  const poolItems = filterByUnlockedChapters(poolToRender, unlockedChapters);
  const currentSrsState =
    currentTabMode === "vocab" ? vocabSrsState : phraseSrsState;

  if (poolItems.length === 0) {
    container.appendChild(
      el("p", {
        style:
          "font-size: 0.95rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem;",
        textContent:
          "No items available. Mark chapters as completed to populate your review pool.",
      }),
    );
    updateExpandCollapseAllButton();
    return;
  }

  const groupedResult = groupItemsForDirectory(
    poolItems,
    currentSrsState,
    currentGroupMode,
  );

  if (groupedResult.type === "chapter") {
    groupedResult.sortedChapterIds.forEach((chId) => {
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
  } else {
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

// --- SESSION LOGIC ---

function startPracticeSession(
  chapterId: string | null = null,
  srsLevel: number | string | null = null,
) {
  const allCombined = [...allVocab, ...allPhrases];
  const poolItems = filterPracticeItems(
    allCombined,
    unlockedChapters,
    getCombinedSrsState(),
    { chapterId, srsLevel },
  );

  if (poolItems.length === 0) {
    alert("No items matched the criteria to review.");
    return;
  }

  session = new PracticeSession<PracticeItem>({
    poolItems,
    srsState: getCombinedSrsState(),
    limit: 10,
  });

  getEl("dashboard-view").style.display = "none";
  getEl("session-view").style.display = "flex";
  getEl("summary-view").style.display = "none";

  // Preload audio
  if (window.preloadTexts) {
    window.preloadTexts(
      session.cards.map((c) => {
        if (c.practiceType === "vocab") return { text: c.character, hash: "" };
        return { text: c.cantoneseRaw, hash: c.audioHash };
      }),
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

  getEl("session-progress-text").textContent =
    `Card ${index + 1} of ${session.cards.length}`;
  getEl("session-progress-fill").style.width = `${progress.percentage}%`;
  getEl("session-chapter-label").textContent =
    `Chapter ${card.chapter}: ${card.chapterTitle}`;

  // Hide both UIs initially
  getEl("vocab-ui-container").style.display = "none";
  getEl("phrase-ui-container").style.display = "none";
  const feedbackPanel = getEl("feedback-panel");
  feedbackPanel.style.display = "none";
  feedbackPanel.innerHTML = "";

  if (card.practiceType === "vocab") {
    // Setup Vocab
    getEl("vocab-ui-container").style.display = "block";
    getEl("flashcard-answer-section").style.display = "none";
    getEl("flashcard-reveal-btn").style.display = "block";

    const charContainer = getEl("flashcard-character-container");
    charContainer.innerHTML = `<span class="vocab-term" data-audio-hash="">${card.character}<span class="tooltip-popover"><strong>${card.jyutping}</strong></span></span>`;
    getEl("flashcard-translation-text").textContent = card.translation;
  } else {
    // Setup Phrase
    getEl("phrase-ui-container").style.display = "block";
    getEl("session-english-prompt").textContent = card.english;
    getEl("game-check-btn").style.display = "inline-flex";
    getEl("game-reset-btn").style.display = "inline-flex";

    assembledTokenIndices = [];
    const indices = session.getShuffledIndices(card.tokens.length);

    renderGameplayBoards(indices);
  }
}

// --- VOCAB LOGIC ---

function revealAnswer() {
  getEl("flashcard-answer-section").style.display = "block";
  getEl("flashcard-reveal-btn").style.display = "none";

  const termEl = document.querySelector(
    "#flashcard-character-container .vocab-term",
  );
  if (termEl instanceof HTMLElement) termEl.click();
}

function gradeCardResponse(remembered: boolean) {
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card) return;

  const res = session.submitResponse(remembered);

  if (card.practiceType === "vocab") {
    vocabSrsState[card.id] = res.updatedCardState!;
  } else {
    phraseSrsState[card.id] = res.updatedCardState!;
  }

  saveState();
  loadCard();
}

// --- PHRASE LOGIC ---

function createAssembledToken(
  origIdx: number,
  assembledIdx: number,
  rawToken: string,
  tokenHashes: Record<string, string>,
  tokensPoolEl: HTMLElement,
) {
  return createTokenChip(
    rawToken,
    () => {
      assembledTokenIndices.splice(assembledIdx, 1);
      const currentPool = Array.from(tokensPoolEl.children)
        .map((child) => parseInt(child.getAttribute("data-index") || "", 10))
        .filter((idx) => !Number.isNaN(idx));
      currentPool.push(origIdx);
      renderGameplayBoards(currentPool);
    },
    tokenHashes,
  );
}

function createPoolToken(
  origIdx: number,
  rawToken: string,
  tokenHashes: Record<string, string>,
  poolIndices: number[],
) {
  const chip = createTokenChip(
    rawToken,
    () => {
      assembledTokenIndices.push(origIdx);
      const newPool = poolIndices.filter((idx) => idx !== origIdx);
      renderGameplayBoards(newPool);
    },
    tokenHashes,
  );
  chip.setAttribute("data-index", String(origIdx));
  return chip;
}

function renderGameplayBoards(poolIndices: number[]) {
  const answerSlotsEl = getEl("game-answer-slots");
  const tokensPoolEl = getEl("game-tokens-pool");

  answerSlotsEl.innerHTML = "";
  tokensPoolEl.innerHTML = "";

  if (!session) return;
  const card = session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  if (assembledTokenIndices.length === 0) {
    answerSlotsEl.appendChild(
      el("span", {
        style:
          "font-size: 0.9rem; color: var(--text-muted); font-style: italic; pointer-events: none;",
        textContent: "Click tokens below to arrange sentence...",
      }),
    );
  } else {
    assembledTokenIndices.forEach((origIdx: number, assembledIdx: number) => {
      const rawToken = card.tokens[origIdx];
      if (!rawToken) return;
      answerSlotsEl.appendChild(
        createAssembledToken(
          origIdx,
          assembledIdx,
          rawToken,
          card.tokenHashes,
          tokensPoolEl,
        ),
      );
    });
  }

  if (poolIndices.length === 0) {
    tokensPoolEl.appendChild(
      el("span", {
        style:
          "font-size: 0.9rem; color: var(--text-muted); font-style: italic; pointer-events: none;",
        textContent: "Sentence fully assembled. Click check below.",
      }),
    );
  } else {
    poolIndices.forEach((origIdx: number) => {
      const rawToken = card.tokens[origIdx];
      if (!rawToken) return;
      tokensPoolEl.appendChild(
        createPoolToken(origIdx, rawToken, card.tokenHashes, poolIndices),
      );
    });
  }
}

function createTokenChip(
  rawToken: string,
  clickCallback: () => void,
  tokenHashes: Record<string, string> = {},
) {
  const chip = document.createElement("div");
  chip.className = "token-chip";
  const inner = document.createElement("div");
  inner.className = "vocab-term";
  inner.innerHTML = compileAnnotationsClient(rawToken, true, tokenHashes);
  chip.appendChild(inner);
  chip.addEventListener("click", (e) => {
    e.preventDefault();
    clickCallback();
  });
  return chip;
}

function resetCurrentCard() {
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  assembledTokenIndices = [];
  const indices = session.getShuffledIndices(card.tokens.length);
  renderGameplayBoards(indices);
}

function createFeedbackAlert(
  card: ClientExample,
  isCorrect: boolean,
  assembledTokenIndices: number[],
  newSrsLevel: number,
  onNextClick: () => void,
): HTMLElement {
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

  const nextBtn = el("button", {
    id: "next-card-btn",
    style:
      "margin-top: 1rem; font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; border: none; background-color: " +
      (isCorrect ? "var(--secondary-color)" : "var(--accent-color)") +
      "; color: #ffffff; border-radius: 4px; padding: 0.5rem 1.5rem; cursor: pointer; float: right;",
    textContent: "Next Card →",
    onClick: onNextClick,
  });

  const cardHtml = el("div", { className: "alert-content" }, [
    !isCorrect
      ? el("div", { style: "font-size: 0.95rem; margin-bottom: 0.6rem;" }, [
          el("strong", { textContent: "Your Order" }),
          document.createTextNode(": "),
          el("span", {
            style: "color: var(--accent-color);",
            textContent: assembledTokenIndices
              .map((idx) => {
                const raw = card.tokens[idx];
                if (!raw) return "";
                const m = raw.match(/^([^[]+)/);
                return m ? m[1] : raw;
              })
              .filter(Boolean)
              .join(" "),
          }),
        ])
      : null,
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
    nextBtn,
    el("div", { style: "clear: both;" }),
  ]);

  const alertBox = el(
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
  );

  return alertBox as HTMLElement;
}

function checkCurrentAnswer() {
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  if (assembledTokenIndices.length !== card.tokens.length) {
    alert("Please use all tokens to assemble the sentence before checking.");
    return;
  }

  const userTokens: string[] = [];
  for (const idx of assembledTokenIndices) {
    const token = card.tokens[idx];
    if (token !== undefined) userTokens.push(token);
  }

  const isCorrect = checkPhraseAnswer(userTokens, card.tokens);

  getEl("game-check-btn").style.display = "none";
  getEl("game-reset-btn").style.display = "none";

  const res = session.submitResponse(isCorrect);
  phraseSrsState[card.id] = res.updatedCardState!;
  saveState();

  const feedbackPanel = getEl("feedback-panel");
  feedbackPanel.style.display = "block";
  feedbackPanel.innerHTML = "";

  const newLevel = res.updatedCardState?.level ?? 1;
  const alertBox = createFeedbackAlert(
    card,
    isCorrect,
    assembledTokenIndices,
    newLevel,
    () => loadCard(),
  );

  feedbackPanel.appendChild(alertBox);
  const ttsBtn = alertBox.querySelector(".tts-btn");

  if (ttsBtn instanceof HTMLElement) ttsBtn.click();
}

// --- SUMMARY LOGIC ---

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
      "Perfect score! You have fully mastered these cards. Keep adding new chapters!";
  } else if (scorePercentage >= 80) {
    msg =
      "Excellent job! Most structures are secure. A little more practice will lock in the rest.";
  } else if (scorePercentage < 50) {
    msg =
      "Spaced repetition works best on cards we struggle with! Keep trying, they will get easier.";
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
