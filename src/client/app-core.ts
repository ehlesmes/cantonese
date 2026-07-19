import { selectBestCantoneseVoice, isPunctuationOnly } from "../utils/text.js";
import { calculateTooltipShift } from "../utils/layout.js";

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing element: " + id);
  return el;
}

// Native Cantonese TTS Engine & Offline Audio Player
let cantoVoice: SpeechSynthesisVoice | null = null;
let activeBtn: HTMLElement | null = null;

function loadVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  cantoVoice = selectBestCantoneseVoice(voices);
  if (cantoVoice) {
    console.log(
      "Selected Cantonese Voice:",
      cantoVoice.name,
      "(",
      cantoVoice.lang,
      ")",
    );
  }
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function getCleanCantoneseText(element: Element) {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll(".tooltip-popover").forEach((el) => el.remove());
  return clone.textContent?.trim() || "";
}

// Browser SHA-256 Hashing fallback (only used if data-audio-hash is missing)
async function getHashAsync(text: string) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);
    } catch (err) {
      console.warn("Hashing failed, falling back:", err);
    }
  }
  return null;
}

// Audio preloading utilities (uses native browser cache, discards elements to prevent leaks)
const preloadedHashes = new Set<string>();

declare global {
  interface Window {
    getCoreState: () => Record<string, unknown>;
  }
}

function preloadAudio(text: string, hash?: string | null) {
  if (hash) {
    triggerPreload(hash);
  } else {
    getHashAsync(text).then((asyncHash) => {
      if (asyncHash) triggerPreload(asyncHash);
    });
  }
}

function triggerPreload(hash: string) {
  if (!hash || preloadedHashes.has(hash)) return;
  preloadedHashes.add(hash);

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  // Creating and immediately discarding Audio element lets the browser's HTTP cache fetch it
  // and keeps the memory footprint clean (no decoder references held in a map).
  // UPDATE: We now use fetch with low priority instead to avoid initializing hardware media decoders.
  fetch(`${baseUrl}/audio/tts/${hash}.mp3`, {
    priority: "low" as RequestPriority,
  }).catch((err) => {
    console.debug("Preload failed:", err);
  });
}

if (typeof window !== "undefined") {
  window.preloadTexts = (
    items: (string | { text: string; hash: string })[],
  ) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item && typeof item === "object") {
          preloadAudio(item.text, item.hash);
        } else {
          preloadAudio(item);
        }
      });
    }
  };
}

// Browser SpeechSynthesis fallback
function speakNativeFallback(text: string, onEndCallback?: () => void) {
  if (!window.speechSynthesis) {
    if (onEndCallback) onEndCallback();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (cantoVoice) {
    utterance.voice = cantoVoice;
  } else {
    utterance.lang = "zh-HK";
  }

  utterance.rate = 0.85; // Slow down native playback speed too

  utterance.onend = () => {
    if (onEndCallback) onEndCallback();
  };
  utterance.onerror = () => {
    if (onEndCallback) onEndCallback();
  };

  window.speechSynthesis.speak(utterance);
}

let playbackAudio: HTMLAudioElement | null = null;

function cleanupPreviousSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (playbackAudio) {
    playbackAudio.pause();
    playbackAudio.onended = null;
    playbackAudio.onerror = null;
  }
  if (activeBtn) {
    activeBtn.classList.remove("tts-playing");
    activeBtn = null;
  }
}

function playAudioWithFallback(
  hash: string,
  text: string,
  onEndCallback?: () => void,
) {
  if (!playbackAudio) {
    playbackAudio = new Audio();
  }

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  playbackAudio.src = `${baseUrl}/audio/tts/${hash}.mp3`;
  playbackAudio.currentTime = 0;
  playbackAudio.playbackRate = 0.85;

  let fallbackTriggered = false;
  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;

    if (playbackAudio) {
      playbackAudio.onended = null;
      playbackAudio.onerror = null;
    }

    speakNativeFallback(text, onEndCallback);
  };

  playbackAudio.onended = () => {
    if (onEndCallback) onEndCallback();
  };

  playbackAudio.onerror = () => {
    triggerFallback();
  };

  playbackAudio.play().catch((err) => {
    console.warn("Audio play failed, using native fallback:", err);
    triggerFallback();
  });
}

async function speakText(
  text: string,
  hash?: string | null,
  onEndCallback?: () => void,
) {
  cleanupPreviousSpeech();

  if (!hash) {
    hash = await getHashAsync(text);
  }

  if (hash) {
    playAudioWithFallback(hash, text, onEndCallback);
  } else {
    speakNativeFallback(text, onEndCallback);
  }
}

function getTargetElementFromTtsBtn(ttsBtn: HTMLElement): HTMLElement | null {
  const exampleCard = ttsBtn.closest(".cantonese-example-card");
  if (exampleCard) {
    return exampleCard.querySelector(".cantonese-sentence") as HTMLElement;
  }
  const dialogueTurn = ttsBtn.closest(".dialogue-turn");
  if (dialogueTurn) {
    return dialogueTurn.querySelector(".dialogue-cantonese") as HTMLElement;
  }
  return null;
}

// Event delegation for TTS clicks
function adjustTooltipPosition(vocabTerm: HTMLElement) {
  const popover = vocabTerm.querySelector(".tooltip-popover") as HTMLElement;
  if (!popover) return;

  popover.style.left = "";
  popover.style.removeProperty("--arrow-offset");

  const rect = popover.getBoundingClientRect();
  const shift = calculateTooltipShift(rect, window.innerWidth, 12);

  if (shift) {
    popover.style.left = shift.leftStyle;
    popover.style.setProperty("--arrow-offset", shift.arrowOffsetStyle);
  }
}

function handleTooltipEvent(e: Event) {
  const target = e.target as HTMLElement;
  const vocabTerm = target.closest(".vocab-term") as HTMLElement;
  if (vocabTerm) {
    adjustTooltipPosition(vocabTerm);
    const text = getCleanCantoneseText(vocabTerm);
    const hash = vocabTerm.dataset.audioHash;
    preloadAudio(text, hash);
  }
}

function handleTtsButtonHover(e: Event) {
  const target = e.target as HTMLElement;
  const ttsBtn = target.closest(".tts-btn") as HTMLElement;
  if (ttsBtn) {
    const targetEl = getTargetElementFromTtsBtn(ttsBtn);
    if (targetEl) {
      const text = getCleanCantoneseText(targetEl);
      const hash = ttsBtn.dataset.audioHash;
      preloadAudio(text, hash);
    }
  }
}

function handleVocabTermClick(e: Event) {
  const target = e.target as HTMLElement;
  const vocabTerm = target.closest(".vocab-term") as HTMLElement;
  if (vocabTerm) {
    e.stopPropagation();

    const text = getCleanCantoneseText(vocabTerm);
    const hash = vocabTerm.dataset.audioHash;

    if (isPunctuationOnly(text)) {
      return;
    }

    speakText(text, hash, () => {
      vocabTerm.classList.remove("tts-playing");
      if (activeBtn === vocabTerm) activeBtn = null;
    });

    vocabTerm.classList.add("tts-playing");
    activeBtn = vocabTerm;

    setTimeout(() => {
      vocabTerm.classList.remove("tts-playing");
    }, 1200);
  }
}

function handleTtsButtonClick(e: Event) {
  const target = e.target as HTMLElement;
  const ttsBtn = target.closest(".tts-btn") as HTMLElement;
  if (ttsBtn) {
    e.stopPropagation();

    const targetEl = getTargetElementFromTtsBtn(ttsBtn);
    if (targetEl) {
      const text = getCleanCantoneseText(targetEl);
      const hash = ttsBtn.dataset.audioHash;

      speakText(text, hash, () => {
        ttsBtn.classList.remove("tts-playing");
        if (activeBtn === ttsBtn) activeBtn = null;
      });

      ttsBtn.classList.add("tts-playing");
      activeBtn = ttsBtn;
    }
  }
}

function initTooltips() {
  document.body.addEventListener("mouseover", handleTooltipEvent, {
    passive: true,
  });
  document.body.addEventListener("touchstart", handleTooltipEvent, {
    passive: true,
  });
  document.body.addEventListener("click", handleTooltipEvent, {
    passive: true,
  });
}

function initTtsHover() {
  document.body.addEventListener("mouseover", handleTtsButtonHover, {
    passive: true,
  });
  document.body.addEventListener("touchstart", handleTtsButtonHover, {
    passive: true,
  });
}

function initClickHandlers() {
  document.body.addEventListener("click", handleVocabTermClick);
  document.body.addEventListener("click", handleTtsButtonClick);
}

function setupVisibilityPreloader() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const ttsBtn = entry.target as HTMLElement;
          observer.unobserve(ttsBtn);

          const targetEl = getTargetElementFromTtsBtn(ttsBtn);
          if (targetEl) {
            const text = getCleanCantoneseText(targetEl);
            const hash = ttsBtn.dataset.audioHash;
            preloadAudio(text, hash);
          }
        }
      });
    },
    { rootMargin: "200px 0px", threshold: 0.0 },
  );

  document.querySelectorAll(".tts-btn").forEach((btn) => observer.observe(btn));
}

async function fetchVersionAndCheck(
  currentVersion: string,
  updateIndicator: HTMLElement | null,
) {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return;
  }
  if (currentVersion === "development") return;

  try {
    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL.slice(0, -1)
      : import.meta.env.BASE_URL;

    const response = await fetch(`${baseUrl}/version.json?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = (await response.json()) as { version?: string };

    if (data?.version && data.version !== currentVersion) {
      if (updateIndicator) updateIndicator.style.display = "inline-flex";
    }
  } catch (err) {
    console.warn("Failed to check version:", err);
  }
}

function initVersionCheck() {
  const updateIndicator = getEl("update-indicator");
  const metaTag = document.querySelector('meta[name="app-version"]');
  const currentVersion = metaTag
    ? metaTag.getAttribute("content")
    : "development";
  let updateChecking = false;

  if (updateIndicator) {
    updateIndicator.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.reload();
    });
  }

  async function checkVersion() {
    if (updateChecking) return;
    updateChecking = true;
    await fetchVersionAndCheck(
      currentVersion || "development",
      updateIndicator,
    );
    updateChecking = false;
  }

  setTimeout(checkVersion, 5000);

  let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      visibilityTimeout = setTimeout(() => {
        checkVersion();
        visibilityTimeout = null;
      }, 2000);
    }
  });

  setInterval(checkVersion, 5 * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  initTooltips();
  initTtsHover();
  initClickHandlers();
  setupVisibilityPreloader();
  initVersionCheck();
});
