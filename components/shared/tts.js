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

  const utterance = new SpeechSynthesisUtterance(text);

  // Try to find a Cantonese voice
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

  const cantoneseVoice = findVoice();

  if (cantoneseVoice) {
    utterance.voice = cantoneseVoice;
  } else {
    // If voices aren't loaded yet, the browser might need a moment.
    // We set the lang as a fallback.
    utterance.lang = "zh-HK";
  }

  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// Pre-warm the voices list
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
