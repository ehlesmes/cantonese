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

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: "zh-HK", name: "Cantonese (Hong Kong)" }]),
  onvoiceschanged: null,
};

Object.defineProperty(global.window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
  configurable: true,
});

// Also mock adoptedStyleSheets as Happy DOM might not fully support it depending on version
if (!("adoptedStyleSheets" in Document.prototype)) {
  Document.prototype.adoptedStyleSheets = [];
}
if (!("adoptedStyleSheets" in ShadowRoot.prototype)) {
  ShadowRoot.prototype.adoptedStyleSheets = [];
}
