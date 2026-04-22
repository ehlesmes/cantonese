/**
 * Shared TTS Utility
 * Speaks Cantonese text using the Web Speech API.
 */
export function speakCantonese(text) {
  if (!('speechSynthesis' in window)) {
    console.error("🚨 TTS Error: Speech Synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a Cantonese voice (zh-HK)
  const voices = window.speechSynthesis.getVoices();
  const cantoneseVoice = voices.find(v => v.lang === 'zh-HK' || v.lang === 'zh_HK');
  
  if (cantoneseVoice) {
    utterance.voice = cantoneseVoice;
  } else {
    // Fallback: set lang and hope the OS handles it
    utterance.lang = 'zh-HK';
    console.warn("⚠️ TTS Warning: Native Cantonese (zh-HK) voice not found. Falling back to browser-selected voice for this locale.");
  }

  utterance.rate = 0.85; // Slightly slower for language learners
  window.speechSynthesis.speak(utterance);
}
