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
import type { ClientChapterData, SrsStateMap } from "../types/index.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

class AdvancedSettingsController {
  private completedList = getEl("completed-chapters-list");
  private cleanIncompleteBtn = getEl("clean-incomplete-btn");
  private clearAllBtn = getEl("clear-all-btn");
  private confirmModal = getEl("confirm-modal");
  private confirmMsg = getEl("confirm-message");
  private modalCancelBtn = getEl("modal-cancel-btn");
  private modalConfirmBtn = getEl("modal-confirm-btn");
  private toast = getEl("toast");

  private allChaptersData: ClientChapterData[] = window.__allChaptersData || [];
  private currentUnlocked: string[] = [];
  private phraseSRS: SrsStateMap = {};
  private vocabSRS: SrsStateMap = {};
  private pendingResetAction: (() => void) | null = null;

  public init() {
    this.setupEventListeners();
    this.renderCompletedChapters();
  }

  private showToast(message: string, type = "success") {
    this.toast.textContent = message;
    this.toast.className = `toast-notification show ${type}`;
    setTimeout(() => {
      this.toast.className = "toast-notification";
    }, 3000);
  }

  private loadLocalStorage() {
    try {
      this.currentUnlocked = getUnlockedChapters();
      this.phraseSRS = getPhraseSRS();
      this.vocabSRS = getVocabSRS();
    } catch (e) {
      console.error("LocalStorage load failed:", e);
      this.showToast("Failed to load local storage state", "error");
    }
  }

  private saveLocalStorage() {
    try {
      saveUnlockedChapters(this.currentUnlocked);
      savePhraseSRS(this.phraseSRS);
      saveVocabSRS(this.vocabSRS);
    } catch (e) {
      console.error("LocalStorage save failed:", e);
      this.showToast("Failed to save to local storage", "error");
    }
  }

  private getSRSCountForChapter(chapterData: ClientChapterData) {
    let phraseCount = 0;
    let vocabCount = 0;

    chapterData.phrases.forEach((pid: string) => {
      if (this.phraseSRS[pid]) phraseCount++;
    });

    chapterData.vocab.forEach((vid: string) => {
      if (this.vocabSRS[vid]) vocabCount++;
    });

    return { phrases: phraseCount, vocab: vocabCount };
  }

  private renderCompletedChapters() {
    this.loadLocalStorage();

    const completedChapters = this.allChaptersData.filter(
      (ch: ClientChapterData) => this.currentUnlocked.includes(ch.id),
    );

    if (completedChapters.length === 0) {
      this.completedList.innerHTML = `
        <div class="placeholder-msg">
          No chapters are currently marked as completed.
        </div>
      `;
      return;
    }

    this.completedList.innerHTML = "";
    completedChapters.forEach((chapter: ClientChapterData) => {
      const srsCounts = this.getSRSCountForChapter(chapter);

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

      card.querySelector(".remove-btn")?.addEventListener("click", () => {
        const chId = chapter.id;
        this.confirmMsg.textContent = `Are you sure you want to remove all progress for Chapter ${chapter.number}: "${chapter.title}"? This will mark it incomplete and remove its SRS progress.`;
        this.pendingResetAction = () =>
          this.removeChapterProgress(chId, chapter.number, chapter.title);
        this.openModal();
      });

      this.completedList.appendChild(card);
    });
  }

  private removeChapterProgress(
    chapterId: string,
    chNum: number,
    chTitle: string,
  ) {
    const chapter = this.allChaptersData.find(
      (ch: ClientChapterData) => ch.id === chapterId,
    );
    const chapterPhrases = chapter?.phrases || [];
    const chapterVocab = chapter?.vocab || [];

    const state = {
      unlockedChapters: this.currentUnlocked,
      phraseSrs: this.phraseSRS,
      vocabSrs: this.vocabSRS,
    };

    const newState = removeChapterProgressState(state, chapterId, {
      phrases: chapterPhrases,
      vocab: chapterVocab,
    });

    this.currentUnlocked = newState.unlockedChapters;
    this.phraseSRS = newState.phraseSrs;
    this.vocabSRS = newState.vocabSrs;

    this.saveLocalStorage();
    this.renderCompletedChapters();
    this.showToast(`Progress removed for Chapter ${chNum}: "${chTitle}"`);
  }

  private cleanIncompleteData() {
    this.loadLocalStorage();

    const state = {
      unlockedChapters: this.currentUnlocked,
      phraseSrs: this.phraseSRS,
      vocabSrs: this.vocabSRS,
    };

    const result = cleanIncompleteProgressState(state, this.allChaptersData);

    this.currentUnlocked = result.newState.unlockedChapters;
    this.phraseSRS = result.newState.phraseSrs;
    this.vocabSRS = result.newState.vocabSrs;

    this.saveLocalStorage();
    this.renderCompletedChapters();

    let msg = `Cleaned up ${result.cleanedPhrasesCount} phrase and ${result.cleanedVocabCount} vocab orphaned records.`;
    if (result.addedPhrasesCount > 0 || result.addedVocabCount > 0) {
      msg += ` Added ${result.addedPhrasesCount} phrase and ${result.addedVocabCount} vocab missing records.`;
    }
    this.showToast(msg);
  }

  private clearAllProgressData() {
    clearAllProgress();
    this.currentUnlocked = [];
    this.phraseSRS = {};
    this.vocabSRS = {};

    this.renderCompletedChapters();
    this.showToast("All progress data cleared successfully.", "success");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  private openModal() {
    this.confirmModal.setAttribute("aria-hidden", "false");
    this.confirmModal.classList.add("show");
  }

  private closeModal() {
    this.confirmModal.setAttribute("aria-hidden", "true");
    this.confirmModal.classList.remove("show");
    this.pendingResetAction = null;
  }

  private setupEventListeners() {
    this.modalCancelBtn.addEventListener("click", () => this.closeModal());

    this.modalConfirmBtn.addEventListener("click", () => {
      if (this.pendingResetAction) {
        this.pendingResetAction();
      }
      this.closeModal();
    });

    this.cleanIncompleteBtn.addEventListener("click", () => {
      this.confirmMsg.textContent =
        "Are you sure you want to clean up all spaced repetition (SRS) records for chapters that are NOT marked as completed? This will discard your learning progress on those items.";
      this.pendingResetAction = () => this.cleanIncompleteData();
      this.openModal();
    });

    this.clearAllBtn.addEventListener("click", () => {
      this.confirmMsg.textContent =
        "CRITICAL: Are you sure you want to delete all Cantonese progress and SRS learning history? This will reset all completed chapters, vocabulary cards, and phrasebook stats. This cannot be undone.";
      this.pendingResetAction = () => this.clearAllProgressData();
      this.openModal();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new AdvancedSettingsController().init();
  });
} else {
  new AdvancedSettingsController().init();
}
