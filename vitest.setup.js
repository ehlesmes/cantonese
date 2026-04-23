import { vi } from "vitest";

// Mocking window.speechSynthesis and related APIs since Happy DOM doesn't have them
global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.lang = "";
    this.rate = 1.0;
    this.voice = null;
  }
};

global.window.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: "zh-HK", name: "Cantonese (Hong Kong)" }]),
};

// Also mock adoptedStyleSheets as Happy DOM might not fully support it depending on version
if (!("adoptedStyleSheets" in Document.prototype)) {
  Document.prototype.adoptedStyleSheets = [];
}
if (!("adoptedStyleSheets" in ShadowRoot.prototype)) {
  ShadowRoot.prototype.adoptedStyleSheets = [];
}

// Mock fetch to prevent network errors when components try to load CSS via <link> tags
global.window.fetch = vi.fn().mockImplementation((url) => {
  if (url.endsWith(".css")) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(""),
    });
  }
  return Promise.reject(new Error(`Unhandled fetch to ${url}`));
});
