import {
  getUnlockedChapters,
  getPhraseSRS,
  savePhraseSRS,
} from "../utils/storage.js";
import { selectCards, gradeCard } from "../utils/srs-engine.js";
import { el, createChevronIcon } from "../utils/dom.js";

// Client-Side Helper to Compile Annotations inline without imports
function compileAnnotationsClient(
  text,
  hideTranslation = true,
  tokenHashes = {},
) {
  if (!text) return "";
  const blockRegex =
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;
  return text.replace(blockRegex, (match, char, jyutping, translation) => {
    const hash = tokenHashes[char] || "";
    if (hideTranslation) {
      return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong></span></span>`;
    }
    return `<span class="vocab-term" data-audio-hash="${hash}">${char}<span class="tooltip-popover"><strong>${jyutping}</strong><br/>${translation}</span></span>`;
  });
}

// Global state and references
let allExamples = [];
let unlockedChapters = [];
let srsState = {};
let sessionCards = [];
let currentCardIndex = 0;
let assembledTokenIndices = [];
let sessionCorrectCount = 0;
let currentGroupMode = "chapter"; // "chapter" or "level"

// Fetch data and initialize
async function initialize() {
  try {
    if (typeof window !== "undefined" && window.__allExamples) {
      allExamples = window.__allExamples;
    } else {
      const baseUrl = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : import.meta.env.BASE_URL + "/";
      const response = await fetch(`${baseUrl}data/phrasebook.json`);
      allExamples = await response.json();
      if (typeof window !== "undefined") {
        window.__allExamples = allExamples;
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
  srsState = getPhraseSRS();
}

function saveState() {
  savePhraseSRS(srsState);
}

function setupEventListeners() {
  // Bind Start Game Button
  const startBtn = document.getElementById("start-session-btn");
  if (startBtn)
    startBtn.addEventListener("click", () => startPracticeSession());

  // Bind Quit Button
  const quitBtn = document.getElementById("session-quit-btn");
  if (quitBtn) quitBtn.addEventListener("click", quitSession);

  // Bind Summary Buttons
  const summaryDashBtn = document.getElementById("summary-dashboard-btn");
  if (summaryDashBtn) summaryDashBtn.addEventListener("click", exitSession);

  const summaryRetryBtn = document.getElementById("summary-retry-btn");
  if (summaryRetryBtn) {
    summaryRetryBtn.addEventListener("click", () => {
      exitSession();
      startPracticeSession();
    });
  }

  // Bind Reset/Check Gameplay Buttons
  const resetBtn = document.getElementById("game-reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", resetCurrentCard);

  const checkBtn = document.getElementById("game-check-btn");
  if (checkBtn) checkBtn.addEventListener("click", checkCurrentAnswer);

  // Bind Directory Grouping Tabs
  const groupChapterBtn = document.getElementById("group-by-chapter-btn");
  const groupLevelBtn = document.getElementById("group-by-level-btn");

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
  const expandCollapseBtn = document.getElementById("expand-collapse-all-btn");
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
  const btn = document.getElementById("expand-collapse-all-btn");
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
  const statsChaptersEl = document.getElementById("stats-chapters-count");
  const statsCardsEl = document.getElementById("stats-cards-count");
  const statsMasteredEl = document.getElementById("stats-mastered-count");

  const poolItems = allExamples.filter((item) =>
    unlockedChapters.includes(item.chapter),
  );

  let masteredCount = 0;
  poolItems.forEach((item) => {
    const itemState = srsState[item.id];
    if (itemState && itemState.level === 5) masteredCount++;
  });

  if (statsChaptersEl) statsChaptersEl.textContent = unlockedChapters.length;
  if (statsCardsEl) statsCardsEl.textContent = poolItems.length;
  if (statsMasteredEl) statsMasteredEl.textContent = masteredCount;

  renderPoolDirectory();
}

// Renders list
function renderPoolDirectory() {
  const container = document.getElementById("review-items-list-container");
  if (!container) return;

  const poolItems = allExamples.filter((item) =>
    unlockedChapters.includes(item.chapter),
  );

  if (poolItems.length === 0) {
    container.innerHTML = "";
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

  container.innerHTML = "";

  container.innerHTML = "";
  if (currentGroupMode === "chapter") {
    const grouped = {};
    poolItems.forEach((item) => {
      if (!grouped[item.chapter]) {
        grouped[item.chapter] = {
          title: item.chapterTitle,
          chapterNumber: item.chapterNumber,
          items: [],
        };
      }
      grouped[item.chapter].items.push(item);
    });

    const sortedChapterIds = Object.keys(grouped).sort((a, b) => {
      return grouped[a].chapterNumber - grouped[b].chapterNumber;
    });

    sortedChapterIds.forEach((chId) => {
      const group = grouped[chId];
      const section = document.createElement("div");
      section.className = "directory-section";

      const reviewBtn = el("button", {
        className: "small-btn",
        textContent: "Review",
      });

      const header = el("div", { className: "directory-group-header" }, [
        el("div", { className: "header-left" }, [
          createChevronIcon(),
          el("span", {
            className: "group-title",
            textContent: `Chapter ${group.chapterNumber}: ${group.title}`,
          }),
          el("span", {
            className: "item-count-badge",
            textContent: String(group.items.length),
          }),
        ]),
        reviewBtn,
      ]);

      const content = document.createElement("div");
      content.className = "directory-group-content review-items-container";

      group.items.forEach((item) => {
        content.appendChild(createItemCardElement(item));
      });

      // Toggle collapse on header click
      header.addEventListener("click", () => {
        section.classList.toggle("collapsed");
        updateExpandCollapseAllButton();
      });

      // Stop click propagation on review button and trigger session
      reviewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startPracticeSession(chId, null);
      });

      section.appendChild(header);
      section.appendChild(content);
      container.appendChild(section);
    });
  } else {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    poolItems.forEach((item) => {
      const state = srsState[item.id];
      const lvl = state ? state.level : 1;
      grouped[lvl].push(item);
    });

    for (let lvl = 1; lvl <= 5; lvl++) {
      const items = grouped[lvl];
      if (items.length === 0) continue;

      const section = document.createElement("div");
      section.className = "directory-section";

      const reviewBtn = el("button", {
        className: "small-btn",
        textContent: "Review",
      });

      const header = el("div", { className: "directory-group-header" }, [
        el("div", { className: "header-left" }, [
          createChevronIcon(),
          el("span", {
            className: "group-title",
            textContent: `SRS Level ${lvl}`,
          }),
          el("span", {
            className: "item-count-badge",
            textContent: String(items.length),
          }),
        ]),
        reviewBtn,
      ]);

      const content = document.createElement("div");
      content.className = "directory-group-content review-items-container";

      items.forEach((item) => {
        content.appendChild(createItemCardElement(item));
      });

      // Toggle collapse on header click
      header.addEventListener("click", () => {
        section.classList.toggle("collapsed");
        updateExpandCollapseAllButton();
      });

      // Stop click propagation on review button and trigger session
      reviewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startPracticeSession(null, lvl);
      });

      section.appendChild(header);
      section.appendChild(content);
      container.appendChild(section);
    }
  }

  updateExpandCollapseAllButton();
}

// Helper to generate a single directory item card
function createItemCardElement(item) {
  const state = srsState[item.id];
  const lvl = state ? state.level : 1;

  const card = document.createElement("div");
  card.className = "review-item-card";

  const textContainer = document.createElement("div");
  textContainer.className = "review-item-text";

  const cantoDiv = document.createElement("div");
  cantoDiv.className = "review-item-canto";
  cantoDiv.innerHTML = compileAnnotationsClient(
    item.cantoneseRaw,
    false,
    item.tokenHashes,
  );

  const engDiv = document.createElement("div");
  engDiv.className = "review-item-english";
  engDiv.textContent = item.english;

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

function startPracticeSession(chapterId = null, srsLevel = null) {
  let poolItems = [];
  if (typeof chapterId === "string" && chapterId) {
    poolItems = allExamples.filter((item) => item.chapter === chapterId);
  } else if (srsLevel !== null && !isNaN(srsLevel)) {
    poolItems = allExamples.filter((item) => {
      const state = srsState[item.id];
      const lvl = state ? state.level : 1;
      return lvl === Number(srsLevel);
    });
  } else {
    poolItems = allExamples.filter((item) =>
      unlockedChapters.includes(item.chapter),
    );
  }

  if (poolItems.length === 0) {
    if (typeof chapterId === "string") {
      alert("This chapter has no phrases to review.");
    } else if (srsLevel !== null) {
      alert(`You have no phrases at SRS Level ${srsLevel} to review.`);
    } else {
      alert(
        "Your review pool is empty. Mark chapters as completed to start practice.",
      );
    }
    return;
  }

  sessionCards = selectCards(poolItems, srsState, 10);
  currentCardIndex = 0;
  sessionCorrectCount = 0;

  document.getElementById("dashboard-view").style.display = "none";
  document.getElementById("session-view").style.display = "flex";
  document.getElementById("summary-view").style.display = "none";

  // Preload audio files for all cards in this session to eliminate playback latency
  if (window.preloadTexts) {
    window.preloadTexts(
      sessionCards.map((c) => ({ text: c.cantoneseRaw, hash: c.audioHash })),
    );
  }

  loadCard(currentCardIndex);
}

function loadCard(index) {
  if (index >= sessionCards.length) {
    showSummary();
    return;
  }

  const card = sessionCards[index];
  assembledTokenIndices = [];

  document.getElementById("session-progress-text").textContent =
    `Card ${index + 1} of ${sessionCards.length}`;
  const fillPercentage = (index / sessionCards.length) * 100;
  document.getElementById("session-progress-fill").style.width =
    `${fillPercentage}%`;

  document.getElementById("session-chapter-label").textContent =
    `Chapter ${card.chapter}: ${card.chapterTitle}`;
  document.getElementById("session-english-prompt").textContent = card.english;

  const feedbackPanel = document.getElementById("feedback-panel");
  feedbackPanel.style.display = "none";
  feedbackPanel.innerHTML = "";

  document.getElementById("game-check-btn").style.display = "inline-flex";
  document.getElementById("game-reset-btn").style.display = "inline-flex";

  const originalTokens = card.tokens;
  const indices = originalTokens.map((_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  renderGameplayBoards(indices);
}

function renderGameplayBoards(poolIndices) {
  const answerSlotsEl = document.getElementById("game-answer-slots");
  const tokensPoolEl = document.getElementById("game-tokens-pool");

  answerSlotsEl.innerHTML = "";
  tokensPoolEl.innerHTML = "";

  const card = sessionCards[currentCardIndex];

  if (assembledTokenIndices.length === 0) {
    answerSlotsEl.appendChild(
      el("span", {
        style:
          "font-size: 0.9rem; color: var(--text-muted); font-style: italic; pointer-events: none;",
        textContent: "Click tokens below to arrange sentence...",
      }),
    );
  } else {
    assembledTokenIndices.forEach((origIdx, assembledIdx) => {
      const rawToken = card.tokens[origIdx];
      const chip = createTokenChip(
        rawToken,
        () => {
          assembledTokenIndices.splice(assembledIdx, 1);

          const currentPool = Array.from(tokensPoolEl.children)
            .map((child) => parseInt(child.getAttribute("data-index"), 10))
            .filter((idx) => !isNaN(idx));

          currentPool.push(origIdx);
          renderGameplayBoards(currentPool);
        },
        card.tokenHashes,
      );
      answerSlotsEl.appendChild(chip);
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
    poolIndices.forEach((origIdx) => {
      const rawToken = card.tokens[origIdx];
      const chip = createTokenChip(
        rawToken,
        () => {
          assembledTokenIndices.push(origIdx);
          const newPool = poolIndices.filter((idx) => idx !== origIdx);
          renderGameplayBoards(newPool);
        },
        card.tokenHashes,
      );
      chip.setAttribute("data-index", origIdx);
      tokensPoolEl.appendChild(chip);
    });
  }
}

function createTokenChip(rawToken, clickCallback, tokenHashes = {}) {
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
  const card = sessionCards[currentCardIndex];
  assembledTokenIndices = [];
  const indices = card.tokens.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  renderGameplayBoards(indices);
}

function checkCurrentAnswer() {
  const card = sessionCards[currentCardIndex];
  const correctIndicesCount = card.tokens.length;

  if (assembledTokenIndices.length !== correctIndicesCount) {
    alert("Please use all tokens to assemble the sentence before checking.");
    return;
  }

  let isCorrect = true;
  for (let i = 0; i < correctIndicesCount; i++) {
    if (card.tokens[assembledTokenIndices[i]] !== card.tokens[i]) {
      isCorrect = false;
      break;
    }
  }

  document.getElementById("game-check-btn").style.display = "none";
  document.getElementById("game-reset-btn").style.display = "none";

  const updatedState = gradeCard(srsState[card.id], isCorrect);
  srsState[card.id] = updatedState;

  if (isCorrect) {
    sessionCorrectCount++;
  }
  saveState();

  const feedbackPanel = document.getElementById("feedback-panel");
  feedbackPanel.style.display = "block";
  feedbackPanel.innerHTML = "";

  const compiledCantoHtml = compileAnnotationsClient(
    card.cantoneseRaw,
    false,
    card.tokenHashes,
  );

  const playIcon = el(
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

  const ttsBtn = el(
    "button",
    {
      className: "tts-btn",
      dataset: { audioHash: card.audioHash },
      title: "Listen",
      "aria-label": "Listen",
    },
    [playIcon],
  );

  const nextBtn = el("button", {
    id: "next-card-btn",
    style:
      "margin-top: 1rem; font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; border: none; background-color: " +
      (isCorrect ? "var(--secondary-color)" : "var(--accent-color)") +
      "; color: #ffffff; border-radius: 4px; padding: 0.5rem 1.5rem; cursor: pointer; float: right;",
    textContent: "Next Card →",
    onClick: () => {
      currentCardIndex++;
      loadCard(currentCardIndex);
    },
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
                const m = raw.match(/^([^[]+)/);
                return m ? m[1] : raw;
              })
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
          ? `Correct! (SRS Level Up to ${updatedState.level})`
          : `Incorrect (SRS Level Down to ${updatedState.level})`,
      }),
      cardHtml,
    ],
  );

  feedbackPanel.innerHTML = "";
  feedbackPanel.appendChild(alertBox);

  // Automatically play pronunciation audio
  ttsBtn.click();
}

function showSummary() {
  document.getElementById("session-view").style.display = "none";
  document.getElementById("summary-view").style.display = "flex";
  document.getElementById("summary-score").textContent =
    `${sessionCorrectCount} / ${sessionCards.length}`;

  const scorePercentage = (sessionCorrectCount / sessionCards.length) * 100;
  let msg =
    "Great practice! Spaced Repetition reinforces memory paths. Continue practicing regularly!";
  if (scorePercentage === 100) {
    msg =
      "Perfect score! You have fully mastered these sentences. Keep adding new chapters!";
  } else if (scorePercentage >= 80) {
    msg =
      "Excellent job! Most structures are secure. A little more practice will lock in the rest.";
  } else if (scorePercentage < 50) {
    msg =
      "Spaced repetition works best on cards we struggle with! Keep trying, they will get easier.";
  }
  document.getElementById("summary-message").textContent = msg;
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
  document.getElementById("dashboard-view").style.display = "flex";
  document.getElementById("session-view").style.display = "none";
  document.getElementById("summary-view").style.display = "none";
  renderDashboard();
}

// Run initialization
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initialize);
}
