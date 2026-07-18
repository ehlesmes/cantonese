import QRCode from "qrcode";
import {
  mergeStates,
  serializeState,
  deserializeState,
  extractRTCToken,
  calculateMergeMetrics,
} from "../utils/sync.js";
import {
  getLocalState,
  saveLocalState,
  type LocalState,
} from "./sys/storage.js";
import type { SDPCoordinates } from "../types/index.js";
import { unpackSDPData } from "../utils/webrtc.js";
import {
  startWebRTC,
  cleanupWebRTC,
  acceptAnswer,
  localRole,
} from "./webrtc-sync.js";
import { startScanner, stopScanner } from "./sys/qr-scanner.js";
import { initOfflineFallback } from "./sync-offline.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

function getInputElement(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLInputElement) return el;
  throw new Error("Missing input element: " + id);
}

function getTextAreaElement(id: string): HTMLTextAreaElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLTextAreaElement) return el;
  throw new Error("Missing textarea element: " + id);
}

function getCanvasElement(id: string): HTMLCanvasElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLCanvasElement) return el;
  throw new Error("Missing canvas element: " + id);
}

function getVideoElement(id: string): HTMLVideoElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLVideoElement) return el;
  throw new Error("Missing video element: " + id);
}

function getButtonElement(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (el instanceof HTMLButtonElement) return el;
  throw new Error("Missing button element: " + id);
}

function init() {
  // DOM Elements
  const overlay = getEl("sync-modal-overlay");
  const closeBtn = getEl("sync-modal-close");

  // Tab Navigation Elements
  const tabShowBtn = getEl("tab-show-btn");
  const tabScanBtn = getEl("tab-scan-btn");
  const tabShowContent = getEl("sync-tab-show-content");
  const tabScanContent = getEl("sync-tab-scan-content");

  // Main UI Elements
  const syncStatusText = getEl("sync-status-text");
  const syncQrWrapper = getEl("sync-qr-wrapper");
  const qrCanvas = getCanvasElement("sync-qr-canvas");
  const qrLoadingText = getEl("qr-loading-text");
  const syncResetBtn = getEl("sync-reset-btn");

  // Scanner Elements
  const scannerSection = getEl("scanner-section");
  const videoWrapper = getEl("scanner-preview-wrapper");
  const video = getVideoElement("sync-video");
  const hiddenCanvas = getCanvasElement("sync-hidden-canvas");
  const scannerStatus = getEl("scanner-status");
  const scanInstructions = getEl("scan-instructions");

  // Answer QR Elements (inside Scan tab)
  const answerQrSection = getEl("answer-qr-section");
  const answerQrCanvas = getCanvasElement("answer-qr-canvas");
  const answerQrLoadingText = getEl("answer-qr-loading-text");

  // Offline accordion elements
  const syncOfflineToggleBtn = getEl("sync-offline-toggle-btn");
  const syncOfflineView = getEl("sync-offline-view");
  const syncOfflineCloseBtn = getEl("sync-offline-close-btn");
  const exportStringInput = getInputElement("sync-export-string");
  const copyBtn = getButtonElement("sync-copy-btn");
  const importStringTextarea = getTextAreaElement("sync-import-string");
  const importSubmitBtn = getButtonElement("sync-import-submit-btn");
  const syncOfflineError = getEl("sync-offline-error");

  // Confirm UI Elements
  const confirmView = getEl("sync-confirm-view");
  const confirmChaptersLocal = getEl("confirm-chapters-local");
  const confirmChaptersMerged = getEl("confirm-chapters-merged");
  const confirmSrsLocal = getEl("confirm-srs-local");
  const confirmSrsMerged = getEl("confirm-srs-merged");
  const confirmVocabLocal = getEl("confirm-vocab-local");
  const confirmVocabMerged = getEl("confirm-vocab-merged");
  const confirmYesBtn = getEl("sync-confirm-yes");
  const confirmNoBtn = getEl("sync-confirm-no");
  const confirmStatusText = getEl("confirm-status-text");

  let currentImportState: LocalState | null = null;

  // Modal Control
  window.addEventListener("click", (e) => {
    if (e.target instanceof Element) {
      const triggerBtn = e.target.closest("#sync-trigger-btn");
      if (triggerBtn) {
        e.preventDefault();
        openModal();
      }
    }
  });

  function openModal() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    resetSync();
    // Offerer: Generate WebRTC Offer instantly on modal open
    startWebRTCSync(true);
  }

  function closeModal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    stopScanner(video, videoWrapper);
    hideConfirmView();
    cleanupWebRTC();
  }

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  function updateStatus(text: string, isError = false) {
    syncStatusText.textContent = text;
    syncStatusText.style.color = isError ? "#ff3b30" : "var(--accent-color)";
  }

  // Tab Switching
  function switchTab(tab: "show" | "scan") {
    if (tab === "show") {
      tabShowBtn.classList.add("active");
      tabShowBtn.setAttribute("aria-selected", "true");
      tabScanBtn.classList.remove("active");
      tabScanBtn.setAttribute("aria-selected", "false");
      tabShowContent.style.display = "flex";
      tabScanContent.style.display = "none";
      stopScanner(video, videoWrapper);
    } else {
      tabShowBtn.classList.remove("active");
      tabShowBtn.setAttribute("aria-selected", "false");
      tabScanBtn.classList.add("active");
      tabScanBtn.setAttribute("aria-selected", "true");
      tabShowContent.style.display = "none";
      tabScanContent.style.display = "flex";
      // Auto-start scanner if not showing an answer QR
      if (answerQrSection.style.display !== "flex") {
        startScanner(
          video,
          videoWrapper,
          hiddenCanvas,
          (status: string) => {
            scannerStatus.textContent = status;
          },
          handleScannedCode,
        );
      }
    }
  }

  tabShowBtn.addEventListener("click", () => switchTab("show"));
  tabScanBtn.addEventListener("click", () => switchTab("scan"));

  // Toggle offline view
  syncOfflineToggleBtn.addEventListener("click", async () => {
    getEl("sync-main-view").style.display = "none";
    syncOfflineView.style.display = "flex";
    stopScanner(video, videoWrapper);

    // Populate offline export code
    const localState = getLocalState();
    exportStringInput.value = await serializeState(localState);
  });

  syncOfflineCloseBtn.addEventListener("click", () => {
    syncOfflineView.style.display = "none";
    getEl("sync-main-view").style.display = "flex";
    resetSync();
  });

  initOfflineFallback({
    exportStringInput,
    copyBtn,
    importStringTextarea,
    importSubmitBtn,
    syncOfflineError,
    onImportState: (state: LocalState) => showConfirmView(state),
  });

  // Reset sync state
  function resetSync() {
    cleanupWebRTC();
    updateStatus("Preparing WebRTC connection...");
    syncQrWrapper.style.display = "none";
    syncResetBtn.style.display = "none";

    // Reset Scan tab sub-elements to scanning mode
    scannerSection.style.display = "flex";
    answerQrSection.style.display = "none";
    scanInstructions.style.display = "block";

    // Hide offline error
    syncOfflineError.style.display = "none";

    stopScanner(video, videoWrapper);
    switchTab("show");
  }

  syncResetBtn.addEventListener("click", () => {
    resetSync();
    startWebRTCSync(true);
  });

  const webrtcCallbacks = {
    onStatusUpdate: updateStatus,
    onQRReady: (url: string) => {
      qrCanvas.style.display = "none";
      qrLoadingText.style.display = "block";
      qrLoadingText.textContent = "Generating QR code...";
      syncQrWrapper.style.display = "flex";

      QRCode.toCanvas(
        qrCanvas,
        url,
        {
          width: 200,
          margin: 1,
          errorCorrectionLevel: "L",
        },
        (err) => {
          if (err) {
            qrLoadingText.textContent = "Failed to generate QR";
          } else {
            qrLoadingText.style.display = "none";
            qrCanvas.style.display = "block";
            updateStatus("Waiting for connection...");
          }
        },
      );
      syncResetBtn.style.display = "block";
    },
    onAnswerReady: (token: string) => {
      answerQrCanvas.style.display = "none";
      answerQrLoadingText.style.display = "block";
      answerQrLoadingText.textContent = "Generating Answer QR...";
      syncResetBtn.style.display = "block";

      QRCode.toCanvas(
        answerQrCanvas,
        token,
        {
          width: 200,
          margin: 1,
          errorCorrectionLevel: "L",
        },
        (err) => {
          if (err) {
            answerQrLoadingText.textContent = "Failed to generate QR";
          } else {
            answerQrLoadingText.style.display = "none";
            answerQrCanvas.style.display = "block";
            updateStatus("Answer generated. Scan it on your other device.");
          }
        },
      );
    },
    onSyncDataReceived: (state: LocalState) => {
      closeModal();
      showConfirmView(state);
    },
  };

  async function startWebRTCSync(
    isInitiator: boolean,
    remoteOfferData: SDPCoordinates | null = null,
  ) {
    await startWebRTC(isInitiator, remoteOfferData, webrtcCallbacks);
  }

  async function handleScannedCode(tokenRaw: string) {
    try {
      const token = extractRTCToken(tokenRaw);
      const data = unpackSDPData(token);
      if (data && data.u && data.p && data.f) {
        if (data.t === "o") {
          stopScanner(video, videoWrapper);
          scannerSection.style.display = "none";
          answerQrSection.style.display = "flex";
          scanInstructions.style.display = "none";

          await startWebRTCSync(false, data);
        } else if (data.t === "a" && localRole === "initiator") {
          stopScanner(video, videoWrapper);
          await acceptAnswer(data, webrtcCallbacks);
        }
      } else {
        scannerStatus.textContent =
          "Invalid sync code format. Keep scanning...";
      }
    } catch (err) {
      console.error("Scan decode error:", err);
      scannerStatus.textContent = "Scan decode error. Keep scanning...";
    }
  }

  // Confirmation Screen Control
  function showConfirmView(importedState: LocalState) {
    currentImportState = importedState;
    confirmStatusText.style.display = "none";
    const localState = getLocalState();
    const metrics = calculateMergeMetrics(localState, importedState);

    confirmChaptersLocal.textContent = String(metrics.chapters.local);
    confirmChaptersMerged.textContent = String(metrics.chapters.merged);

    confirmSrsLocal.textContent = String(metrics.phrases.local);
    confirmSrsMerged.textContent = String(metrics.phrases.merged);

    confirmVocabLocal.textContent = String(metrics.vocab.local);
    confirmVocabMerged.textContent = String(metrics.vocab.merged);

    confirmView.style.display = "flex";
    overlay.classList.add("open");
  }

  function hideConfirmView() {
    confirmView.style.display = "none";
    confirmStatusText.style.display = "none";
    currentImportState = null;
    importStringTextarea.value = "";
  }

  confirmNoBtn.addEventListener("click", hideConfirmView);

  confirmYesBtn.addEventListener("click", () => {
    if (currentImportState) {
      confirmStatusText.style.display = "none";
      const localState = getLocalState();
      const merged = mergeStates(localState, currentImportState);

      const success = saveLocalState(merged);
      if (success) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("rtc");
        cleanUrl.searchParams.delete("import");
        window.history.replaceState({}, document.title, cleanUrl.toString());

        confirmStatusText.textContent =
          "Progress successfully merged! Reloading...";
        confirmStatusText.style.color = "#34c759"; // Success green
        confirmStatusText.style.display = "block";

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        confirmStatusText.textContent =
          "Failed to write progress to local storage.";
        confirmStatusText.style.color = "#ff3b30"; // Error red
        confirmStatusText.style.display = "block";
      }
    }
  });

  // Handle incoming URL parameters on initial load
  const params = new URLSearchParams(window.location.search);
  const rtcParam = params.get("rtc");
  if (rtcParam) {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("rtc");
    window.history.replaceState({}, document.title, cleanUrl.toString());

    (async () => {
      try {
        const data = unpackSDPData(rtcParam);
        if (data && data.t === "o") {
          overlay.classList.add("open");
          overlay.setAttribute("aria-hidden", "false");
          resetSync();

          switchTab("scan");
          scannerSection.style.display = "none";
          answerQrSection.style.display = "flex";
          scanInstructions.style.display = "none";

          updateStatus("Scanned Offer URL. Generating Answer...");
          await startWebRTCSync(false, data);
        }
      } catch (e) {
        console.error("Failed to parse incoming RTC offer:", e);
      }
    })();
  }

  const importParam = params.get("import");
  if (importParam) {
    (async () => {
      const state = await deserializeState(importParam);
      if (state) {
        setTimeout(() => {
          showConfirmView(state);
        }, 300);
      } else {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("import");
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    })();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
