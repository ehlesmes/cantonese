import QRCode from "qrcode";
import {
  getLocalState,
  mergeStates,
  saveLocalState,
  serializeState,
  deserializeState,
} from "../utils/sync.js";
import { unpackSDPData } from "../utils/webrtc.js";
import {
  startWebRTC,
  cleanupWebRTC,
  acceptAnswer,
  localRole,
} from "./webrtc-sync.js";
import { startScanner, stopScanner } from "./qr-scanner.js";
import { initOfflineFallback } from "./sync-offline.js";

function init() {
  // DOM Elements
  const overlay = document.getElementById("sync-modal-overlay");
  const closeBtn = document.getElementById("sync-modal-close");

  // Tab Navigation Elements
  const tabShowBtn = document.getElementById("tab-show-btn");
  const tabScanBtn = document.getElementById("tab-scan-btn");
  const tabShowContent = document.getElementById("sync-tab-show-content");
  const tabScanContent = document.getElementById("sync-tab-scan-content");

  // Main UI Elements
  const syncStatusText = document.getElementById("sync-status-text");
  const syncQrWrapper = document.getElementById("sync-qr-wrapper");
  const qrCanvas = document.getElementById("sync-qr-canvas");
  const qrLoadingText = document.getElementById("qr-loading-text");
  const syncResetBtn = document.getElementById("sync-reset-btn");

  // Scanner Elements
  const scannerSection = document.getElementById("scanner-section");
  const videoWrapper = document.getElementById("scanner-preview-wrapper");
  const video = document.getElementById("sync-video");
  const hiddenCanvas = document.getElementById("sync-hidden-canvas");
  const scannerStatus = document.getElementById("scanner-status");
  const scanInstructions = document.getElementById("scan-instructions");

  // Answer QR Elements (inside Scan tab)
  const answerQrSection = document.getElementById("answer-qr-section");
  const answerQrCanvas = document.getElementById("answer-qr-canvas");
  const answerQrLoadingText = document.getElementById("answer-qr-loading-text");

  // Offline accordion elements
  const syncOfflineToggleBtn = document.getElementById(
    "sync-offline-toggle-btn",
  );
  const syncOfflineView = document.getElementById("sync-offline-view");
  const syncOfflineCloseBtn = document.getElementById("sync-offline-close-btn");
  const exportStringInput = document.getElementById("sync-export-string");
  const copyBtn = document.getElementById("sync-copy-btn");
  const importStringTextarea = document.getElementById("sync-import-string");
  const importSubmitBtn = document.getElementById("sync-import-submit-btn");
  const syncOfflineError = document.getElementById("sync-offline-error");

  // Confirm UI Elements
  const confirmView = document.getElementById("sync-confirm-view");
  const confirmChaptersLocal = document.getElementById(
    "confirm-chapters-local",
  );
  const confirmChaptersMerged = document.getElementById(
    "confirm-chapters-merged",
  );
  const confirmSrsLocal = document.getElementById("confirm-srs-local");
  const confirmSrsMerged = document.getElementById("confirm-srs-merged");
  const confirmVocabLocal = document.getElementById("confirm-vocab-local");
  const confirmVocabMerged = document.getElementById("confirm-vocab-merged");
  const confirmYesBtn = document.getElementById("sync-confirm-yes");
  const confirmNoBtn = document.getElementById("sync-confirm-no");
  const confirmStatusText = document.getElementById("confirm-status-text");

  let currentImportState = null;

  // Modal Control
  window.addEventListener("click", (e) => {
    const triggerBtn = e.target.closest("#sync-trigger-btn");
    if (triggerBtn) {
      e.preventDefault();
      openModal();
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

  function updateStatus(text, isError = false) {
    syncStatusText.textContent = text;
    syncStatusText.style.color = isError ? "#ff3b30" : "var(--accent-color)";
  }

  // Tab Switching
  function switchTab(tab) {
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
          (status) => {
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
    document.getElementById("sync-main-view").style.display = "none";
    syncOfflineView.style.display = "flex";
    stopScanner(video, videoWrapper);

    // Populate offline export code
    const localState = getLocalState();
    exportStringInput.value = await serializeState(localState);
  });

  syncOfflineCloseBtn.addEventListener("click", () => {
    syncOfflineView.style.display = "none";
    document.getElementById("sync-main-view").style.display = "flex";
    resetSync();
  });

  initOfflineFallback({
    exportStringInput,
    copyBtn,
    importStringTextarea,
    importSubmitBtn,
    syncOfflineError,
    onImportState: (state) => showConfirmView(state),
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
    onQRReady: (url) => {
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
    onAnswerReady: (token) => {
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
    onSyncDataReceived: (state) => {
      closeModal();
      showConfirmView(state);
    },
  };

  async function startWebRTCSync(isInitiator, remoteOfferData = null) {
    await startWebRTC(isInitiator, remoteOfferData, webrtcCallbacks);
  }

  async function handleScannedCode(tokenRaw) {
    try {
      let token = tokenRaw;
      try {
        const url = new URL(tokenRaw);
        const rtcParam = url.searchParams.get("rtc");
        if (rtcParam) token = rtcParam;
      } catch {
        // Not a URL
      }

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
  function showConfirmView(importedState) {
    currentImportState = importedState;
    confirmStatusText.style.display = "none";
    const localState = getLocalState();
    const merged = mergeStates(localState, importedState);

    const countKeys = (obj) => Object.keys(obj || {}).length;

    confirmChaptersLocal.textContent = String(localState.chapters.length);
    confirmChaptersMerged.textContent = String(merged.chapters.length);

    confirmSrsLocal.textContent = String(countKeys(localState.srs));
    confirmSrsMerged.textContent = String(countKeys(merged.srs));

    confirmVocabLocal.textContent = String(countKeys(localState.vocab));
    confirmVocabMerged.textContent = String(countKeys(merged.vocab));

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
