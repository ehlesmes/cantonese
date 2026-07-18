import {
  getUnlockedChapters,
  getPhraseSRS,
  getVocabSRS,
  saveUnlockedChapters,
  savePhraseSRS,
  saveVocabSRS,
  clearAllProgress,
} from "./sys/storage.js";
import {
  removeChapterProgressState,
  cleanIncompleteProgressState,
} from "../utils/storage-modifiers.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

import type { ClientChapterData, SrsStateMap } from "../types/index.js";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const completedList = getEl("completed-chapters-list");
  const cleanIncompleteBtn = getEl("clean-incomplete-btn");
  const clearAllBtn = getEl("clear-all-btn");
  const confirmModal = getEl("confirm-modal");
  const confirmMsg = getEl("confirm-message");
  const modalCancelBtn = getEl("modal-cancel-btn");
  const modalConfirmBtn = getEl("modal-confirm-btn");
  const toast = getEl("toast");

  const allChaptersData = window.__allChaptersData || [];
  let currentUnlocked: string[] = [];
  let phraseSRS: SrsStateMap = {};
  let vocabSRS: SrsStateMap = {};
  let pendingResetAction: (() => void) | null = null;

  // Toast notification helper
  function showToast(message: string, type = "success") {
    toast.textContent = message;
    toast.className = `toast-notification show ${type}`;
    setTimeout(() => {
      toast.className = "toast-notification";
    }, 3000);
  }

  // Load state using centralized storage
  function loadLocalStorage() {
    try {
      currentUnlocked = getUnlockedChapters();
      phraseSRS = getPhraseSRS();
      vocabSRS = getVocabSRS();
    } catch (e) {
      console.error("LocalStorage load failed:", e);
      showToast("Failed to load local storage state", "error");
    }
  }

  // Save state using centralized storage
  function saveLocalStorage() {
    try {
      saveUnlockedChapters(currentUnlocked);
      savePhraseSRS(phraseSRS);
      saveVocabSRS(vocabSRS);
    } catch (e) {
      console.error("LocalStorage save failed:", e);
      showToast("Failed to save to local storage", "error");
    }
  }

  // Count SRS records for a chapter
  function getSRSCountForChapter(chapterData: ClientChapterData) {
    let phraseCount = 0;
    let vocabCount = 0;

    chapterData.phrases.forEach((pid: string) => {
      if (phraseSRS[pid]) phraseCount++;
    });

    chapterData.vocab.forEach((vid: string) => {
      if (vocabSRS[vid]) vocabCount++;
    });

    return { phrases: phraseCount, vocab: vocabCount };
  }

  // Render completed chapters list
  function renderCompletedChapters() {
    loadLocalStorage();

    const completedChapters = allChaptersData.filter((ch: ClientChapterData) =>
      currentUnlocked.includes(ch.id),
    );

    if (completedChapters.length === 0) {
      completedList.innerHTML = `
        <div class="placeholder-msg">
          No chapters are currently marked as completed.
        </div>
      `;
      return;
    }

    completedList.innerHTML = "";
    completedChapters.forEach((chapter: ClientChapterData) => {
      const srsCounts = getSRSCountForChapter(chapter);

      const card = document.createElement("div");
      card.className = "chapter-row";
      card.innerHTML = `
        <div class="chapter-info">
          <div class="chapter-title-row">
            <span class="chapter-num">Chapter ${chapter.number}</span>
            <span class="chapter-title">${chapter.title}</span>
          </div>
          <div class="chapter-counts">
            <span>SRS Progress:</span> 
            <span class="count-tag">${srsCounts.phrases} Phrases</span>
            <span class="count-tag">${srsCounts.vocab} Vocabulary</span>
          </div>
        </div>
        <button class="remove-btn" data-chapter-id="${chapter.id}">
          Remove Progress
        </button>
      `;

      // Wire up delete event
      card.querySelector(".remove-btn")?.addEventListener("click", () => {
        const chId = chapter.id;
        confirmMsg.textContent = `Are you sure you want to remove all progress for Chapter ${chapter.number}: "${chapter.title}"? This will mark it incomplete and remove its SRS progress.`;
        pendingResetAction = () =>
          removeChapterProgress(chId, chapter.number, chapter.title);
        openModal();
      });

      completedList.appendChild(card);
    });
  }

  // Remove single chapter progress
  function removeChapterProgress(
    chapterId: string,
    chNum: number,
    chTitle: string,
  ) {
    const chapter = allChaptersData.find(
      (ch: ClientChapterData) => ch.id === chapterId,
    );
    const chapterPhrases = chapter?.phrases || [];
    const chapterVocab = chapter?.vocab || [];

    const state = {
      unlockedChapters: currentUnlocked,
      phraseSrs: phraseSRS,
      vocabSrs: vocabSRS,
    };

    const newState = removeChapterProgressState(state, chapterId, {
      phrases: chapterPhrases,
      vocab: chapterVocab,
    });

    currentUnlocked = newState.unlockedChapters;
    phraseSRS = newState.phraseSrs;
    vocabSRS = newState.vocabSrs;

    saveLocalStorage();
    renderCompletedChapters();
    showToast(`Progress removed for Chapter ${chNum}: "${chTitle}"`);
  }

  // Clean incomplete chapters' data
  function cleanIncompleteData() {
    loadLocalStorage();

    const state = {
      unlockedChapters: currentUnlocked,
      phraseSrs: phraseSRS,
      vocabSrs: vocabSRS,
    };

    const result = cleanIncompleteProgressState(state, allChaptersData);

    currentUnlocked = result.newState.unlockedChapters;
    phraseSRS = result.newState.phraseSrs;
    vocabSRS = result.newState.vocabSrs;

    saveLocalStorage();
    renderCompletedChapters();

    let msg = `Cleaned up ${result.cleanedPhrasesCount} phrase and ${result.cleanedVocabCount} vocab orphaned records.`;
    if (result.addedPhrasesCount > 0 || result.addedVocabCount > 0) {
      msg += ` Added ${result.addedPhrasesCount} phrase and ${result.addedVocabCount} vocab missing records.`;
    }
    showToast(msg);
  }

  // Clear all progress data
  function clearAllProgressData() {
    clearAllProgress();
    currentUnlocked = [];
    phraseSRS = {};
    vocabSRS = {};

    renderCompletedChapters();
    showToast("All progress data cleared successfully.", "success");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  // Modal helper functions
  function openModal() {
    confirmModal.setAttribute("aria-hidden", "false");
    confirmModal.classList.add("show");
  }

  // Explicitly define closeModal so it can be called cleanly
  function closeModal() {
    confirmModal.setAttribute("aria-hidden", "true");
    confirmModal.classList.remove("show");
    pendingResetAction = null;
  }

  // Event Listeners
  modalCancelBtn.addEventListener("click", closeModal);

  modalConfirmBtn.addEventListener("click", () => {
    if (pendingResetAction) {
      pendingResetAction();
    }
    closeModal();
  });

  cleanIncompleteBtn.addEventListener("click", () => {
    confirmMsg.textContent =
      "Are you sure you want to clean up all spaced repetition (SRS) records for chapters that are NOT marked as completed? This will discard your learning progress on those items.";
    pendingResetAction = cleanIncompleteData;
    openModal();
  });

  clearAllBtn.addEventListener("click", () => {
    confirmMsg.textContent =
      "CRITICAL: Are you sure you want to delete all Cantonese progress and SRS learning history? This will reset all completed chapters, vocabulary cards, and phrasebook stats. This cannot be undone.";
    pendingResetAction = clearAllProgressData;
    openModal();
  });

  // Initial Render
  renderCompletedChapters();
});
