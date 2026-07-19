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
  if (el) return el;
  throw new Error("Missing DOM element: " + id);
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

class SyncUIController {
  // DOM Elements
  private overlay = getEl("sync-modal-overlay");
  private closeBtn = getEl("sync-modal-close");
  private tabShowBtn = getEl("tab-show-btn");
  private tabScanBtn = getEl("tab-scan-btn");
  private tabShowContent = getEl("sync-tab-show-content");
  private tabScanContent = getEl("sync-tab-scan-content");
  private syncStatusText = getEl("sync-status-text");
  private syncQrWrapper = getEl("sync-qr-wrapper");
  private qrCanvas = getCanvasElement("sync-qr-canvas");
  private qrLoadingText = getEl("qr-loading-text");
  private syncResetBtn = getEl("sync-reset-btn");
  private scannerSection = getEl("scanner-section");
  private videoWrapper = getEl("scanner-preview-wrapper");
  private video = getVideoElement("sync-video");
  private hiddenCanvas = getCanvasElement("sync-hidden-canvas");
  private scannerStatus = getEl("scanner-status");
  private scanInstructions = getEl("scan-instructions");
  private answerQrSection = getEl("answer-qr-section");
  private answerQrCanvas = getCanvasElement("answer-qr-canvas");
  private answerQrLoadingText = getEl("answer-qr-loading-text");
  private syncOfflineToggleBtn = getEl("sync-offline-toggle-btn");
  private syncOfflineView = getEl("sync-offline-view");
  private syncOfflineCloseBtn = getEl("sync-offline-close-btn");
  private exportStringInput = getInputElement("sync-export-string");
  private copyBtn = getButtonElement("sync-copy-btn");
  private importStringTextarea = getTextAreaElement("sync-import-string");
  private importSubmitBtn = getButtonElement("sync-import-submit-btn");
  private syncOfflineError = getEl("sync-offline-error");
  private confirmView = getEl("sync-confirm-view");
  private confirmChaptersLocal = getEl("confirm-chapters-local");
  private confirmChaptersMerged = getEl("confirm-chapters-merged");
  private confirmSrsLocal = getEl("confirm-srs-local");
  private confirmSrsMerged = getEl("confirm-srs-merged");
  private confirmVocabLocal = getEl("confirm-vocab-local");
  private confirmVocabMerged = getEl("confirm-vocab-merged");
  private confirmYesBtn = getEl("sync-confirm-yes");
  private confirmNoBtn = getEl("sync-confirm-no");
  private confirmStatusText = getEl("confirm-status-text");

  private currentImportState: LocalState | null = null;

  public init() {
    this.setupModalNavigation();
    this.setupManualSync();
    this.setupConfirmScreen();
    this.checkForImportQuery();
  }

  private setupModalNavigation() {
    window.addEventListener("click", (e) => {
      if (e.target instanceof Element) {
        const triggerBtn = e.target.closest("#sync-trigger-btn");
        if (triggerBtn) {
          e.preventDefault();
          this.openModal();
        }
      }
    });

    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.closeModal();
    });

    this.tabShowBtn.addEventListener("click", () => this.switchTab("show"));
    this.tabScanBtn.addEventListener("click", () => this.switchTab("scan"));
  }

  private openModal() {
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.resetSync();
    this.startWebRTCSync(true);
  }

  private closeModal() {
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
    stopScanner(this.video, this.videoWrapper);
    this.hideConfirmView();
    cleanupWebRTC();
  }

  private updateStatus(text: string, isError = false) {
    this.syncStatusText.textContent = text;
    this.syncStatusText.style.color = isError
      ? "#ff3b30"
      : "var(--accent-color)";
  }

  private switchTab(tab: "show" | "scan") {
    if (tab === "show") {
      this.tabShowBtn.classList.add("active");
      this.tabShowBtn.setAttribute("aria-selected", "true");
      this.tabScanBtn.classList.remove("active");
      this.tabScanBtn.setAttribute("aria-selected", "false");
      this.tabShowContent.style.display = "flex";
      this.tabScanContent.style.display = "none";
      stopScanner(this.video, this.videoWrapper);
    } else {
      this.tabShowBtn.classList.remove("active");
      this.tabShowBtn.setAttribute("aria-selected", "false");
      this.tabScanBtn.classList.add("active");
      this.tabScanBtn.setAttribute("aria-selected", "true");
      this.tabShowContent.style.display = "none";
      this.tabScanContent.style.display = "flex";

      if (this.answerQrSection.style.display !== "flex") {
        startScanner(
          this.video,
          this.videoWrapper,
          this.hiddenCanvas,
          (status: string) => {
            this.scannerStatus.textContent = status;
          },
          (code) => this.handleScannedCode(code),
        );
      }
    }
  }

  private setupManualSync() {
    this.syncOfflineToggleBtn.addEventListener("click", async () => {
      getEl("sync-main-view").style.display = "none";
      this.syncOfflineView.style.display = "flex";
      stopScanner(this.video, this.videoWrapper);

      const localState = getLocalState();
      this.exportStringInput.value = await serializeState(localState);
    });

    this.syncOfflineCloseBtn.addEventListener("click", () => {
      this.syncOfflineView.style.display = "none";
      getEl("sync-main-view").style.display = "flex";
      this.resetSync();
    });

    initOfflineFallback({
      exportStringInput: this.exportStringInput,
      copyBtn: this.copyBtn,
      importStringTextarea: this.importStringTextarea,
      importSubmitBtn: this.importSubmitBtn,
      syncOfflineError: this.syncOfflineError,
      onImportState: (state: LocalState) => this.showConfirmView(state),
    });

    this.syncResetBtn.addEventListener("click", () => {
      this.resetSync();
      this.startWebRTCSync(true);
    });
  }

  private resetSync() {
    cleanupWebRTC();
    this.updateStatus("Preparing WebRTC connection...");
    this.syncQrWrapper.style.display = "none";
    this.syncResetBtn.style.display = "none";

    this.scannerSection.style.display = "flex";
    this.answerQrSection.style.display = "none";
    this.scanInstructions.style.display = "block";

    this.syncOfflineError.style.display = "none";

    stopScanner(this.video, this.videoWrapper);
    this.switchTab("show");
  }

  private getWebrtcCallbacks() {
    return {
      onStatusUpdate: (text: string, err?: boolean) =>
        this.updateStatus(text, err),
      onQRReady: (url: string) => {
        this.qrCanvas.style.display = "none";
        this.qrLoadingText.style.display = "block";
        this.qrLoadingText.textContent = "Generating QR code...";
        this.syncQrWrapper.style.display = "flex";

        QRCode.toCanvas(
          this.qrCanvas,
          url,
          { width: 200, margin: 1, errorCorrectionLevel: "L" },
          (err) => {
            if (err) {
              this.qrLoadingText.textContent = "Failed to generate QR";
            } else {
              this.qrLoadingText.style.display = "none";
              this.qrCanvas.style.display = "block";
              this.updateStatus("Waiting for connection...");
            }
          },
        );
        this.syncResetBtn.style.display = "block";
      },
      onAnswerReady: (token: string) => {
        this.answerQrCanvas.style.display = "none";
        this.answerQrLoadingText.style.display = "block";
        this.answerQrLoadingText.textContent = "Generating Answer QR...";
        this.syncResetBtn.style.display = "block";

        QRCode.toCanvas(
          this.answerQrCanvas,
          token,
          { width: 200, margin: 1, errorCorrectionLevel: "L" },
          (err) => {
            if (err) {
              this.answerQrLoadingText.textContent = "Failed to generate QR";
            } else {
              this.answerQrLoadingText.style.display = "none";
              this.answerQrCanvas.style.display = "block";
              this.updateStatus(
                "Answer generated. Scan it on your other device.",
              );
            }
          },
        );
      },
      onSyncDataReceived: (state: LocalState) => {
        this.closeModal();
        this.showConfirmView(state);
      },
    };
  }

  private async startWebRTCSync(
    isInitiator: boolean,
    remoteOfferData: SDPCoordinates | null = null,
  ) {
    await startWebRTC(isInitiator, remoteOfferData, this.getWebrtcCallbacks());
  }

  private async handleScannedCode(tokenRaw: string) {
    try {
      const token = extractRTCToken(tokenRaw);
      const data = unpackSDPData(token);
      if (data && data.u && data.p && data.f) {
        if (data.t === "o") {
          stopScanner(this.video, this.videoWrapper);
          this.scannerSection.style.display = "none";
          this.answerQrSection.style.display = "flex";
          this.scanInstructions.style.display = "none";

          await this.startWebRTCSync(false, data);
        } else if (data.t === "a" && localRole === "initiator") {
          stopScanner(this.video, this.videoWrapper);
          await acceptAnswer(data, this.getWebrtcCallbacks());
        }
      } else {
        this.scannerStatus.textContent =
          "Invalid sync code format. Keep scanning...";
      }
    } catch (err) {
      console.error("Scan decode error:", err);
      this.scannerStatus.textContent = "Scan decode error. Keep scanning...";
    }
  }

  private showConfirmView(importedState: LocalState) {
    this.currentImportState = importedState;
    this.confirmStatusText.style.display = "none";
    const localState = getLocalState();
    const metrics = calculateMergeMetrics(localState, importedState);

    this.confirmChaptersLocal.textContent = String(metrics.chapters.local);
    this.confirmChaptersMerged.textContent = String(metrics.chapters.merged);
    this.confirmSrsLocal.textContent = String(metrics.phrases.local);
    this.confirmSrsMerged.textContent = String(metrics.phrases.merged);
    this.confirmVocabLocal.textContent = String(metrics.vocab.local);
    this.confirmVocabMerged.textContent = String(metrics.vocab.merged);

    this.confirmView.style.display = "flex";
    this.overlay.classList.add("open");
  }

  private hideConfirmView() {
    this.confirmView.style.display = "none";
    this.confirmStatusText.style.display = "none";
    this.currentImportState = null;
    this.importStringTextarea.value = "";
  }

  private setupConfirmScreen() {
    this.confirmNoBtn.addEventListener("click", () => this.hideConfirmView());

    this.confirmYesBtn.addEventListener("click", () => {
      if (this.currentImportState) {
        this.confirmStatusText.style.display = "none";
        const localState = getLocalState();
        const merged = mergeStates(localState, this.currentImportState);

        const success = saveLocalState(merged);
        if (success) {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("rtc");
          cleanUrl.searchParams.delete("import");
          window.history.replaceState({}, document.title, cleanUrl.toString());

          this.confirmStatusText.textContent =
            "Progress successfully merged! Reloading...";
          this.confirmStatusText.style.color = "#34c759";
          this.confirmStatusText.style.display = "block";

          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          this.confirmStatusText.textContent =
            "Failed to write progress to local storage.";
          this.confirmStatusText.style.color = "#ff3b30";
          this.confirmStatusText.style.display = "block";
        }
      }
    });
  }

  private checkForImportQuery() {
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
            this.overlay.classList.add("open");
            this.overlay.setAttribute("aria-hidden", "false");
            this.resetSync();

            this.switchTab("scan");
            this.scannerSection.style.display = "none";
            this.answerQrSection.style.display = "flex";
            this.scanInstructions.style.display = "none";

            this.updateStatus("Scanned Offer URL. Generating Answer...");
            await this.startWebRTCSync(false, data);
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
            this.showConfirmView(state);
          }, 300);
        } else {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("import");
          window.history.replaceState({}, document.title, cleanUrl.toString());
        }
      })();
    }
  }
}

export function init() {
  const controller = new SyncUIController();
  controller.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
