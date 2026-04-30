/**
 * Shared TTS Utility
 * Speaks Cantonese text using the Web Speech API.
 */

/**
 * @typedef {Object} VoiceConfig
 * @property {number} [index=0] - The index of the Cantonese voice to use.
 * @property {number} [pitch=1.0] - The pitch of the voice (0.1 to 2.0).
 * @property {number} [rate=0.85] - The rate of speech (0.1 to 10).
 */

/**
 * Speaks Cantonese text.
 * @param {string} text - The text to speak.
 * @param {VoiceConfig} [config={}] - Voice configuration.
 * @param {SpeechSynthesisVoice} [explicitVoice] - Optional explicit voice to use (ignores preference).
 */
export function speakCantonese(text, config = {}, explicitVoice) {
  const { index = 0, pitch = 1.0, rate = 0.85 } = config;

  if (!("speechSynthesis" in window)) {
    console.error("🚨 TTS Error: Speech Synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const speak = (voices) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (explicitVoice) {
      utterance.voice = explicitVoice;
    } else {
      const preferredName = window.localStorage.getItem("cantonese_preferred_voice_name");
      const preferredVoice = voices.find((v) => v.name === preferredName);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else if (voices.length > 0) {
        utterance.voice = voices[index % voices.length];
      } else {
        utterance.lang = "zh-HK";
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  const currentVoices = getAvailableVoices();

  if (currentVoices.length > 0 || window.speechSynthesis.getVoices().length > 0) {
    speak(currentVoices);
  } else {
    // If voices aren't loaded yet, wait for them.
    const onVoicesChanged = () => {
      const lateVoices = getAvailableVoices();
      speak(lateVoices);
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
  }
}

/**
 * Returns a prioritized list of available Cantonese voices.
 * Groups by specificity (exact lang match vs name match) and reverses each group.
 * @returns {SpeechSynthesisVoice[]}
 */
export function getAvailableVoices() {
  if (!("speechSynthesis" in window)) return [];

  const voices = window.speechSynthesis.getVoices();
  const high = [];
  const low = [];

  voices.forEach((v) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    const name = v.name.toLowerCase();
    const isHigh = lang === "zh-hk" || lang === "yue-hk";
    const isLow = name.includes("cantonese") || name.includes("hong kong");

    if (isHigh) {
      high.push(v);
    } else if (isLow) {
      low.push(v);
    }
  });

  return [...high.reverse(), ...low.reverse()];
}

/**
 * Returns the number of available Cantonese voices.
 * @returns {number}
 */
export function getCantoneseVoiceCount() {
  return getAvailableVoices().length;
}

// Pre-warm the voices list
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
