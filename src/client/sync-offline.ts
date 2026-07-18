import { serializeState, deserializeState } from "../utils/sync.js";
import { getLocalState, type LocalState } from "./sys/storage.js";

export function initOfflineFallback({
  exportStringInput,
  copyBtn,
  importStringTextarea,
  importSubmitBtn,
  syncOfflineError,
  onImportState,
}: {
  exportStringInput: HTMLInputElement;
  copyBtn: HTMLButtonElement;
  importStringTextarea: HTMLTextAreaElement;
  importSubmitBtn: HTMLButtonElement;
  syncOfflineError: HTMLElement;
  onImportState: (state: LocalState) => void;
}) {
  // Generate code on demand
  exportStringInput.addEventListener("focus", async () => {
    if (!exportStringInput.value) {
      const localState = getLocalState();
      exportStringInput.value = await serializeState(localState);
    }
  });

  // Copy to Clipboard (Offline Fallback)
  copyBtn.addEventListener("click", async () => {
    if (!exportStringInput.value) {
      const localState = getLocalState();
      exportStringInput.value = await serializeState(localState);
    }
    exportStringInput.select();
    exportStringInput.setSelectionRange(0, 99999);
    navigator.clipboard
      .writeText(exportStringInput.value)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.style.backgroundColor = "var(--secondary-color)";
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.backgroundColor = "";
        }, 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  });

  // Offline Import Manual Paste Submit
  importSubmitBtn.addEventListener("click", async () => {
    syncOfflineError.style.display = "none";
    const val = importStringTextarea.value.trim();
    if (!val) return;

    const state = await deserializeState(val);
    if (state) {
      onImportState(state);
    } else {
      syncOfflineError.textContent =
        "Invalid sync code. Please check that you copied the complete code string.";
      syncOfflineError.style.display = "block";
    }
  });
}
