import { el } from "../sys/dom.js";
import { compileAnnotationsClient } from "../../utils/dom.js";
import { filterPracticeItems } from "../../utils/srs-engine.js";
import { PracticeSession } from "../../utils/practice-session.js";
import { checkPhraseAnswer } from "../../utils/text.js";
import type { ClientExample } from "../../types/index.js";
import {
  state,
  getCombinedSrsState,
  saveState,
  type PracticeItem,
} from "./state.js";
import { renderDashboard } from "./dashboard.js";
import { createFeedbackAlert } from "./feedback-ui.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

declare global {
  interface Window {
    preloadTexts?: (items: (string | { text: string; hash: string })[]) => void;
  }
}

// --- SESSION LOGIC ---

function startPracticeSession(
  chapterId: string | null = null,
  srsLevel: number | string | null = null,
) {
  const allCombined = [...state.allVocab, ...state.allPhrases];
  const poolItems = filterPracticeItems(
    allCombined,
    state.unlockedChapters,
    getCombinedSrsState(),
    { chapterId, srsLevel },
  );

  if (poolItems.length === 0) {
    alert("No items matched the criteria to review.");
    return;
  }

  state.session = new PracticeSession<PracticeItem>({
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
      state.session.cards.map((c) => {
        if (c.practiceType === "vocab") return { text: c.character, hash: "" };
        return { text: c.cantoneseRaw, hash: c.audioHash };
      }),
    );
  }

  loadCard();
}

function loadCard() {
  const session = state.session;
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

    state.assembledTokenIndices = [];
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
  const session = state.session;
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card) return;

  const res = session.submitResponse(remembered);

  if (card.practiceType === "vocab") {
    state.vocabSrsState[card.id] = res.updatedCardState!;
  } else {
    state.phraseSrsState[card.id] = res.updatedCardState!;
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
      state.assembledTokenIndices.splice(assembledIdx, 1);
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
      state.assembledTokenIndices.push(origIdx);
      const newPool = poolIndices.filter((idx) => idx !== origIdx);
      renderGameplayBoards(newPool);
    },
    tokenHashes,
  );
  chip.setAttribute("data-index", String(origIdx));
  return chip;
}

function renderAnswerSlotsState(
  answerSlotsEl: HTMLElement,
  tokensPoolEl: HTMLElement,
  card: ClientExample,
) {
  if (state.assembledTokenIndices.length === 0) {
    answerSlotsEl.appendChild(
      el("span", {
        style:
          "font-size: 0.9rem; color: var(--text-muted); font-style: italic; pointer-events: none;",
        textContent: "Click tokens below to arrange sentence...",
      }),
    );
  } else {
    state.assembledTokenIndices.forEach(
      (origIdx: number, assembledIdx: number) => {
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
      },
    );
  }
}

function renderTokensPoolState(
  tokensPoolEl: HTMLElement,
  card: ClientExample,
  poolIndices: number[],
) {
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

function renderGameplayBoards(poolIndices: number[]) {
  const answerSlotsEl = getEl("game-answer-slots");
  const tokensPoolEl = getEl("game-tokens-pool");

  answerSlotsEl.innerHTML = "";
  tokensPoolEl.innerHTML = "";

  if (!state.session) return;
  const card = state.session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  renderAnswerSlotsState(answerSlotsEl, tokensPoolEl, card);
  renderTokensPoolState(tokensPoolEl, card, poolIndices);
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
  const session = state.session;
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  state.assembledTokenIndices = [];
  const indices = session.getShuffledIndices(card.tokens.length);
  renderGameplayBoards(indices);
}

function checkCurrentAnswer() {
  const session = state.session;
  if (!session) return;
  const card = session.getCurrentCard();
  if (!card || card.practiceType !== "phrase") return;

  if (state.assembledTokenIndices.length !== card.tokens.length) {
    alert("Please use all tokens to assemble the sentence before checking.");
    return;
  }

  const userTokens: string[] = [];
  for (const idx of state.assembledTokenIndices) {
    const token = card.tokens[idx];
    if (token !== undefined) userTokens.push(token);
  }

  const isCorrect = checkPhraseAnswer(userTokens, card.tokens);

  getEl("game-check-btn").style.display = "none";
  getEl("game-reset-btn").style.display = "none";

  const res = session.submitResponse(isCorrect);
  state.phraseSrsState[card.id] = res.updatedCardState!;
  saveState();

  const feedbackPanel = getEl("feedback-panel");
  feedbackPanel.style.display = "block";
  feedbackPanel.innerHTML = "";

  const newLevel = res.updatedCardState?.level ?? 1;
  const alertBox = createFeedbackAlert(card, isCorrect, newLevel, () =>
    loadCard(),
  );

  feedbackPanel.appendChild(alertBox);
  const ttsBtn = alertBox.querySelector(".tts-btn");

  if (ttsBtn instanceof HTMLElement) ttsBtn.click();
}

// --- SUMMARY LOGIC ---

function showSummary() {
  const session = state.session;
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

export {
  startPracticeSession,
  quitSession,
  exitSession,
  gradeCardResponse,
  checkCurrentAnswer,
  resetCurrentCard,
  revealAnswer,
};
