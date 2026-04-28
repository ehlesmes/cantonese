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
 */
export function speakCantonese(text, config = {}) {
  const { index = 0, pitch = 1.0, rate = 0.85 } = config;

  if (!("speechSynthesis" in window)) {
    console.error(
      "🚨 TTS Error: Speech Synthesis not supported in this browser.",
    );
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const findAllVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.filter((v) => {
      const lang = v.lang.toLowerCase().replace("_", "-");
      return (
        lang === "zh-hk" ||
        lang === "yue-hk" ||
        v.name.toLowerCase().includes("cantonese") ||
        v.name.toLowerCase().includes("hong kong")
      );
    });
  };

  const speak = (voices) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (voices.length > 0) {
      utterance.voice = voices[index % voices.length];
    } else {
      utterance.lang = "zh-HK";
    }

    window.speechSynthesis.speak(utterance);
  };

  const currentVoices = findAllVoices();

  if (
    currentVoices.length > 0 ||
    window.speechSynthesis.getVoices().length > 0
  ) {
    speak(currentVoices);
  } else {
    // If voices aren't loaded yet, wait for them.
    const onVoicesChanged = () => {
      const lateVoices = findAllVoices();
      speak(lateVoices);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoicesChanged,
      );
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
  }
}

/**
 * Returns the number of available Cantonese voices.
 * @returns {number}
 */
export function getCantoneseVoiceCount() {
  if (!("speechSynthesis" in window)) return 0;
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    return (
      lang === "zh-hk" ||
      lang === "yue-hk" ||
      v.name.toLowerCase().includes("cantonese") ||
      v.name.toLowerCase().includes("hong kong")
    );
  }).length;
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
