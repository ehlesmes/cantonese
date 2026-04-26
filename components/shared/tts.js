/**
 * Shared TTS Utility
 * Speaks Cantonese text using the Web Speech API.
 */
export function speakCantonese(text) {
  if (!("speechSynthesis" in window)) {
    console.error(
      "🚨 TTS Error: Speech Synthesis not supported in this browser.",
    );
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const findVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => {
      const lang = v.lang.toLowerCase().replace("_", "-");
      return (
        lang === "zh-hk" ||
        lang === "yue-hk" ||
        v.name.toLowerCase().includes("cantonese") ||
        v.name.toLowerCase().includes("hong kong")
      );
    });
  };

  const speak = (voice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
    } else {
      utterance.lang = "zh-HK";
    }
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const initialVoice = findVoice();

  if (initialVoice) {
    speak(initialVoice);
  } else if (window.speechSynthesis.getVoices().length === 0) {
    // If voices aren't loaded yet, wait for them.
    const onVoicesChanged = () => {
      const lateVoice = findVoice();
      speak(lateVoice);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoicesChanged,
      );
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
  } else {
    // Voices are loaded but no Cantonese voice found, use fallback lang
    speak(null);
  }
}

// Pre-warm the voices list
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
