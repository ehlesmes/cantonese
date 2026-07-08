import {
  getUnlockedChapters,
  getPhraseSRS,
  getVocabSRS,
  saveUnlockedChapters,
  savePhraseSRS,
  saveVocabSRS,
  clearAllProgress,
} from "../utils/storage.js";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const completedList = document.getElementById("completed-chapters-list");
  const cleanIncompleteBtn = document.getElementById("clean-incomplete-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMsg = document.getElementById("confirm-message");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const toast = document.getElementById("toast");

  const allChaptersData = window.__allChaptersData || [];
  let currentUnlocked = [];
  let phraseSRS = {};
  let vocabSRS = {};
  let pendingResetAction = null;

  // Toast notification helper
  function showToast(message, type = "success") {
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
  function getSRSCountForChapter(chapterData) {
    let phraseCount = 0;
    let vocabCount = 0;

    chapterData.phrases.forEach((pid) => {
      if (phraseSRS[pid]) phraseCount++;
    });

    chapterData.vocab.forEach((vid) => {
      if (vocabSRS[vid]) vocabCount++;
    });

    return { phrases: phraseCount, vocab: vocabCount };
  }

  // Render completed chapters list
  function renderCompletedChapters() {
    loadLocalStorage();

    const completedChapters = allChaptersData.filter((ch) =>
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
    completedChapters.forEach((chapter) => {
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
      card.querySelector(".remove-btn").addEventListener("click", () => {
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
  function removeChapterProgress(chapterId, chNum, chTitle) {
    currentUnlocked = currentUnlocked.filter((id) => id !== chapterId);

    const chapter = allChaptersData.find((ch) => ch.id === chapterId);
    if (chapter) {
      chapter.phrases.forEach((pid) => {
        delete phraseSRS[pid];
      });
      chapter.vocab.forEach((vid) => {
        delete vocabSRS[vid];
      });
    }

    saveLocalStorage();
    renderCompletedChapters();
    showToast(`Progress removed for Chapter ${chNum}: "${chTitle}"`);
  }

  // Clean incomplete chapters' data
  function cleanIncompleteData() {
    loadLocalStorage();
    let cleanedPhrases = 0;
    let cleanedVocab = 0;

    allChaptersData.forEach((chapter) => {
      if (!currentUnlocked.includes(chapter.id)) {
        chapter.phrases.forEach((pid) => {
          if (phraseSRS[pid]) {
            delete phraseSRS[pid];
            cleanedPhrases++;
          }
        });
        chapter.vocab.forEach((vid) => {
          if (vocabSRS[vid]) {
            delete vocabSRS[vid];
            cleanedVocab++;
          }
        });
      }
    });

    saveLocalStorage();
    renderCompletedChapters();
    showToast(
      `Cleaned up ${cleanedPhrases} phrase and ${cleanedVocab} vocab orphaned records.`,
    );
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
